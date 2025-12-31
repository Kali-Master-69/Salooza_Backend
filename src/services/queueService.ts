import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { QueueStatus, Prisma, ServiceDuration } from '@prisma/client';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';


/**
 * Calculate the current queue position for a specific queue item.
 * Position = count of items with WAITING or SERVING status that were created before this item + 1
 * 
 * IMPORTANT: This is calculated at runtime, NOT stored in the database.
 * It reflects the dynamic queue position as other customers are served and removed.
 */
export const calculateCurrentPosition = async (itemId: string): Promise<number> => {
    const item = await prisma.queueItem.findUnique({
        where: { id: itemId },
        select: { queueId: true, entryTime: true }
    });

    if (!item) throw new AppError('Queue item not found', 404);

    // Count all items in the same queue that are ahead of this item
    // "Ahead" means: same queue, status is WAITING or SERVING, and entered earlier
    const itemsAhead = await prisma.queueItem.count({
        where: {
            queueId: item.queueId,
            status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] },
            entryTime: { lt: item.entryTime } // Entered before this item
        }
    });

    // Current position = items ahead + 1 (since we're the next in line after those ahead)
    return itemsAhead + 1;
};

export const getShopQueue = async (shopId: string, skipStatusCheck: boolean = false) => {

    const queue = await prisma.queue.findUnique({
        where: { shopId },
        include: {
            items: {
                where: {
                    status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] },
                },
                include: {
                    customer: true,
                    services: true,
                },
                orderBy: { entryTime: 'asc' },
            },
            shop: {
                include: {
                    services: { include: { durations: true } },
                    barbers: true,
                },
            },
        },
    });

    if (!queue) throw new AppError('Queue not found for this shop', 404);

    const status = getShopStatus(queue.shop);
    if (!skipStatusCheck && status !== ShopStatus.ACTIVE && status !== ShopStatus.PAUSED) {
        throw new AppError('This shop is not available for customers', 403);
    }



    // Calculate wait time
    const activeBarbersCount = queue.shop.barbers.length;

    // Filter waiting items
    const waitingItems = queue.items.filter((i: any) => i.status === QueueStatus.WAITING);

    let totalServiceTime = 0;
    waitingItems.forEach((item: any) => {
        const itemDuration = item.services.reduce((acc: number, s: any) => acc + s.duration, 0);
        totalServiceTime += itemDuration;
    });

    const estimatedWaitTime = activeBarbersCount > 0
        ? Math.ceil(totalServiceTime / activeBarbersCount)
        : totalServiceTime; // Fallback if no barbers active (maybe shop closed)

    return {
        ...queue,
        status, // Added shop status
        metrics: {
            activeBarbers: activeBarbersCount,
            customersWaiting: waitingItems.length,
            estimatedWaitTime,
        }
    };
};


export const joinQueue = async (shopId: string, customerId: string, serviceIds: string[]) => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Get Queue and Lock it (Prisma doesn't easily lock rows like SELECT FOR UPDATE without raw query, 
        // but we can rely on atomicity of transaction logic for consistency checks if we re-read).
        // For high concurrency, we'd use raw SQL `SELECT ... FOR UPDATE`.

        // Check shop state using centralized logic
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: {
                queue: true,
                services: { include: { durations: true } },
                barbers: true
            }
        });

        if (!shop) throw new AppError('Shop not found', 404);
        if (!shop.queue) throw new AppError('Queue not initialized for this shop', 400);

        const status = getShopStatus(shop);
        if (status !== ShopStatus.ACTIVE) {
            if (status === ShopStatus.PAUSED) throw new AppError('Queue is currently paused or no barbers available', 400);
            if (status === ShopStatus.DRAFT) throw new AppError('Shop is incomplete and cannot accept customers', 400);
            throw new AppError('Shop is currently closed', 400);
        }

        const queueId = shop.queue.id;


        // Check if customer already in queue
        const existingEntry = await tx.queueItem.findFirst({
            where: {
                queueId,
                customerId,
                status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] }
            }
        });

        if (existingEntry) throw new AppError('Customer already in queue', 400);

        // Calculate token number - get the highest current token number
        const lastItem = await tx.queueItem.findFirst({
            where: { queueId },
            orderBy: { tokenNumber: 'desc' }
        });
        
        const nextTokenNumber = (lastItem?.tokenNumber ?? 0) + 1;

        // Calculate current estimate to store snapshot
        // We re-calculate inside transaction to be safe? 
        // For simplicity, we assume the snapshot is "current state".

        // Get durations
        const services = await tx.serviceDuration.findMany({
            where: { id: { in: serviceIds } }
        });

        if (services.length !== serviceIds.length) throw new AppError('Invalid services selected', 400);

        const itemDuration = services.reduce((acc: number, s: ServiceDuration) => acc + s.duration, 0);

        // Create item
        const newItem = await tx.queueItem.create({
            data: {
                queueId,
                customerId,
                status: QueueStatus.WAITING,
                tokenNumber: nextTokenNumber,
                estimatedWaitTime: 0, // Placeholder, can be updated or calculated dynamically
                services: {
                    connect: serviceIds.map(id => ({ id }))
                }
            }
        });

        return newItem;
    });
};

export const joinWalkIn = async (shopId: string, walkInName: string, serviceIds: string[]) => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: { queue: true, services: { include: { durations: true } } }
        });

        if (!shop) throw new AppError('Shop not found', 404);
        if (!shop.queue) throw new AppError('Queue not initialized for this shop', 400);

        // Calculate token number for walk-in
        const lastItem = await tx.queueItem.findFirst({
            where: { queueId: shop.queue.id },
            orderBy: { tokenNumber: 'desc' }
        });
        
        const nextTokenNumber = (lastItem?.tokenNumber ?? 0) + 1;

        const services = await tx.serviceDuration.findMany({
            where: { id: { in: serviceIds } }
        });

        if (services.length !== serviceIds.length) throw new AppError('Invalid services selected', 400);

        const newItem = await tx.queueItem.create({
            data: {
                queueId: shop.queue.id,
                isWalkIn: true,
                walkInName,
                status: QueueStatus.WAITING,
                tokenNumber: nextTokenNumber,
                estimatedWaitTime: 0,
                services: {
                    connect: serviceIds.map(id => ({ id }))
                }
            }
        });

        return newItem;
    });
};

export const updateQueueItemStatus = async (itemId: string, status: QueueStatus, barberId?: string) => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const item = await tx.queueItem.findUnique({ where: { id: itemId }, include: { services: true } });
        if (!item) throw new AppError('Item not found', 404);

        // Update status
        const updatedItem = await tx.queueItem.update({
            where: { id: itemId },
            data: { status }
        });

        // If COMPLETED, log visit (only if customerId exists)
        if (status === QueueStatus.COMPLETED && barberId && item.customerId) {
            const totalPrice = item.services.reduce((acc: number, s: any) => acc + Number(s.price), 0);

            await tx.customerVisit.create({
                data: {
                    customerId: item.customerId,
                    barberId: barberId,
                    startTime: item.entryTime,
                    endTime: new Date(),
                    totalPrice,
                    services: {
                        connect: item.services.map((s: any) => ({ id: s.id }))
                    }
                }
            });
        }

        return updatedItem;
    });
};
