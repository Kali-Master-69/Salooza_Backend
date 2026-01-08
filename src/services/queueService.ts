import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { QueueStatus, Prisma, ServiceDuration } from '@prisma/client';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';
import * as shopService from './shopService';


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

/**
 * Get queue preview for a shop - shows how many customers are ahead.
 * This is READ-ONLY and privacy-friendly (no user details exposed).
 * Used before customer joins to show "Currently X people waiting"
 */
export const getQueuePreview = async (shopId: string): Promise<{ customersWaiting: number }> => {
    const queue = await prisma.queue.findUnique({
        where: { shopId }
    });

    if (!queue) {
        // Queue doesn't exist yet - shop might not have any customers
        return { customersWaiting: 0 };
    }

    // Count customers currently WAITING or SERVING (not completed/cancelled)
    const customersWaiting = await prisma.queueItem.count({
        where: {
            queueId: queue.id,
            status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] }
        }
    });

    return { customersWaiting };
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
        },
    });

    if (!queue) throw new AppError('Queue not found for this shop', 404);

    const shop = await shopService.getShopById(shopId);
    if (!shop) throw new AppError('Shop not found', 404);

    const status = getShopStatus(shop);
    if (!skipStatusCheck && status !== ShopStatus.ACTIVE && status !== ShopStatus.PAUSED) {
        throw new AppError('This shop is not available for customers', 403);
    }



    // Calculate wait time
    const activeBarbersCount = shop.barbers?.length || 0;

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
        shop, // Added full shop details from shopService
        status, // Added shop status
        metrics: {
            activeBarbers: activeBarbersCount,
            customersWaiting: waitingItems.length,
            estimatedWaitTime,
        }
    };
};


export const joinQueue = async (shopId: string, customerId: string, serviceIds: string[]) => {
    console.log("[DEBUG SERVICE] joinQueue called:", { shopId, customerId, serviceIds });

    // Check shop state using centralized logic (calling shopService instead of prisma)
    const shop = await shopService.getShopById(shopId);
    if (!shop) throw new AppError('Shop not found', 404);
    if (!shop.queue) throw new AppError('Queue not initialized for this shop', 400);

    const status = getShopStatus(shop);
    if (status !== ShopStatus.ACTIVE) {
        if (status === ShopStatus.PAUSED) throw new AppError('Queue is currently paused or no barbers available', 400);
        if (status === ShopStatus.DRAFT) throw new AppError('Shop is incomplete and cannot accept customers', 400);
        throw new AppError('Shop is currently closed', 400);
    }

    const queueId = shop.queue.id;

    // Get durations from shopService
    const services = await shopService.getServiceDurations(serviceIds);
    if (services.length !== serviceIds.length) throw new AppError('Invalid services selected', 400);

    let newItem;

    newItem = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

        // Create item
        const newItem = await tx.queueItem.create({
            data: {
                queueId,
                customerId,
                status: QueueStatus.WAITING,
                tokenNumber: nextTokenNumber,
                estimatedWaitTime: 0,
                services: {
                    connect: serviceIds.map(id => ({ id }))
                }
            }
        });

        console.log("[DEBUG SERVICE] Queue item created with tokenNumber:", newItem.tokenNumber);
        return newItem;
    });

    // Calculate current position after transaction completes (immediate calculation)
    const currentPosition = await calculateCurrentPosition(newItem.id);

    // Return item with currentPosition attached
    const result = {
        ...newItem,
        currentPosition
    };

    console.log("[DEBUG SERVICE] Returning joinQueue result with currentPosition:", currentPosition);
    return result;
};

export const joinWalkIn = async (shopId: string, walkInName: string, serviceIds: string[]) => {
    // Check shop from shopService
    const shop = await shopService.getShopById(shopId);
    if (!shop) throw new AppError('Shop not found', 404);
    if (!shop.queue) throw new AppError('Queue not initialized for this shop', 400);

    // Get durations from shopService
    const services = await shopService.getServiceDurations(serviceIds);
    if (services.length !== serviceIds.length) throw new AppError('Invalid services selected', 400);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Calculate token number for walk-in
        const lastItem = await tx.queueItem.findFirst({
            where: { queueId: shop.queue!.id },
            orderBy: { tokenNumber: 'desc' }
        });

        const nextTokenNumber = (lastItem?.tokenNumber ?? 0) + 1;

        const newItem = await tx.queueItem.create({
            data: {
                queueId: shop.queue!.id,
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


import * as customerService from './customerService';

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

            await customerService.logVisit({
                customerId: item.customerId,
                barberId: barberId,
                startTime: item.entryTime,
                endTime: new Date(),
                totalPrice,
                services: {
                    connect: item.services.map((s: any) => ({ id: s.id }))
                }
            }, tx);
        }

        return updatedItem;
    });
};


export const toggleQueuePause = async (shopId: string, isPaused: boolean) => {
    return await prisma.queue.update({
        where: { shopId },
        data: { isPaused }
    });
};

export const getCustomerActiveQueueItem = async (customerId: string) => {
    return await prisma.queueItem.findFirst({
        where: {
            customerId,
            status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] }
        },
        include: {
            services: { include: { service: true } },
            queue: { include: { shop: true } }
        }
    });
};

export const leaveQueue = async (itemId: string, customerId: string) => {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const item = await tx.queueItem.findUnique({
            where: { id: itemId },
            include: { queue: true }
        });

        if (!item) throw new AppError('Queue item not found', 404);

        // Only the customer who joined can leave
        if (item.customerId !== customerId) {
            throw new AppError('You can only leave your own queue entry', 403);
        }

        // Can only cancel if in WAITING status
        if (item.status !== QueueStatus.WAITING) {
            throw new AppError('Can only leave queue while waiting. You are already being served or have completed.', 400);
        }

        // Mark as CANCELLED instead of deleting
        const updatedItem = await tx.queueItem.update({
            where: { id: itemId },
            data: { status: QueueStatus.CANCELLED }
        });

        return updatedItem;
    });
};
