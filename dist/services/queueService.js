"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQueueItemStatus = exports.joinQueue = exports.getShopQueue = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const getShopQueue = async (shopId) => {
    const queue = await prisma_1.default.queue.findUnique({
        where: { shopId },
        include: {
            items: {
                where: {
                    status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] },
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
    if (!queue)
        throw new AppError_1.AppError('Queue not found for this shop', 404);
    // Calculate wait time
    const activeBarbersCount = queue.shop.barbers.length;
    // Filter waiting items
    const waitingItems = queue.items.filter((i) => i.status === client_1.QueueStatus.WAITING);
    let totalServiceTime = 0;
    waitingItems.forEach((item) => {
        const itemDuration = item.services.reduce((acc, s) => acc + s.duration, 0);
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
exports.getShopQueue = getShopQueue;
const joinQueue = async (shopId, customerId, serviceIds) => {
    return await prisma_1.default.$transaction(async (tx) => {
        // 1. Get Queue and Lock it (Prisma doesn't easily lock rows like SELECT FOR UPDATE without raw query, 
        // but we can rely on atomicity of transaction logic for consistency checks if we re-read).
        // For high concurrency, we'd use raw SQL `SELECT ... FOR UPDATE`.
        // Check if shop is open/active
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: { queue: true }
        });
        if (!shop || !shop.isActive)
            throw new AppError_1.AppError('Shop is currently closed', 400);
        if (shop.queue?.isPaused)
            throw new AppError_1.AppError('Queue is currently paused', 400);
        const queueId = shop.queue.id;
        // Check if customer already in queue
        const existingEntry = await tx.queueItem.findFirst({
            where: {
                queueId,
                customerId,
                status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] }
            }
        });
        if (existingEntry)
            throw new AppError_1.AppError('Customer already in queue', 400);
        // Calculate current estimate to store snapshot
        // We re-calculate inside transaction to be safe? 
        // For simplicity, we assume the snapshot is "current state".
        // Get durations
        const services = await tx.serviceDuration.findMany({
            where: { id: { in: serviceIds } }
        });
        if (services.length !== serviceIds.length)
            throw new AppError_1.AppError('Invalid services selected', 400);
        const itemDuration = services.reduce((acc, s) => acc + s.duration, 0);
        // Create item
        const newItem = await tx.queueItem.create({
            data: {
                queueId,
                customerId,
                status: client_1.QueueStatus.WAITING,
                estimatedWaitTime: 0, // Placeholder, can be updated or calculated dynamically
                services: {
                    connect: serviceIds.map(id => ({ id }))
                }
            }
        });
        return newItem;
    });
};
exports.joinQueue = joinQueue;
const updateQueueItemStatus = async (itemId, status, barberId) => {
    return await prisma_1.default.$transaction(async (tx) => {
        const item = await tx.queueItem.findUnique({ where: { id: itemId }, include: { services: true } });
        if (!item)
            throw new AppError_1.AppError('Item not found', 404);
        // Update status
        const updatedItem = await tx.queueItem.update({
            where: { id: itemId },
            data: { status }
        });
        // If COMPLETED, log visit
        if (status === client_1.QueueStatus.COMPLETED && barberId) {
            const totalPrice = item.services.reduce((acc, s) => acc + Number(s.price), 0); // Decimal handling needed
            await tx.customerVisit.create({
                data: {
                    customerId: item.customerId,
                    barberId: barberId,
                    startTime: item.entryTime, // Approximation or track actual start
                    endTime: new Date(),
                    totalPrice,
                    services: {
                        connect: item.services.map((s) => ({ id: s.id }))
                    }
                }
            });
        }
        return updatedItem;
    });
};
exports.updateQueueItemStatus = updateQueueItemStatus;
