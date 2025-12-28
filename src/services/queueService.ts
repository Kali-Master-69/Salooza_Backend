import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { QueueStatus, Prisma, ServiceDuration } from '@prisma/client';

export const getShopQueue = async (shopId: string) => {
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
                    barbers: { where: { isActive: true } },
                },
            },
        },
    });

    if (!queue) throw new AppError('Queue not found for this shop', 404);

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

        // Check if shop is open/active
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: { queue: true }
        });

        if (!shop || !shop.isActive) throw new AppError('Shop is currently closed', 400);
        if (shop.queue?.isPaused) throw new AppError('Queue is currently paused', 400);

        const queueId = shop.queue!.id;

        // Check if customer already in queue
        const existingEntry = await tx.queueItem.findFirst({
            where: {
                queueId,
                customerId,
                status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] }
            }
        });

        if (existingEntry) throw new AppError('Customer already in queue', 400);

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
                estimatedWaitTime: 0, // Placeholder, can be updated or calculated dynamically
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

        // If COMPLETED, log visit
        if (status === QueueStatus.COMPLETED && barberId) {
            const totalPrice = item.services.reduce((acc: number, s: any) => acc + Number(s.price), 0); // Decimal handling needed

            await tx.customerVisit.create({
                data: {
                    customerId: item.customerId,
                    barberId: barberId,
                    startTime: item.entryTime, // Approximation or track actual start
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
