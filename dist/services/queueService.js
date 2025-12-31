"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveQueue = exports.updateQueueItemStatus = exports.joinWalkIn = exports.joinQueue = exports.getShopQueue = exports.getQueuePreview = exports.calculateCurrentPosition = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const shopStatus_1 = require("../utils/shopStatus");
const shop_1 = require("../types/shop");
/**
 * Calculate the current queue position for a specific queue item.
 * Position = count of items with WAITING or SERVING status that were created before this item + 1
 *
 * IMPORTANT: This is calculated at runtime, NOT stored in the database.
 * It reflects the dynamic queue position as other customers are served and removed.
 */
const calculateCurrentPosition = async (itemId) => {
    const item = await prisma_1.default.queueItem.findUnique({
        where: { id: itemId },
        select: { queueId: true, entryTime: true }
    });
    if (!item)
        throw new AppError_1.AppError('Queue item not found', 404);
    // Count all items in the same queue that are ahead of this item
    // "Ahead" means: same queue, status is WAITING or SERVING, and entered earlier
    const itemsAhead = await prisma_1.default.queueItem.count({
        where: {
            queueId: item.queueId,
            status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] },
            entryTime: { lt: item.entryTime } // Entered before this item
        }
    });
    // Current position = items ahead + 1 (since we're the next in line after those ahead)
    return itemsAhead + 1;
};
exports.calculateCurrentPosition = calculateCurrentPosition;
/**
 * Get queue preview for a shop - shows how many customers are ahead.
 * This is READ-ONLY and privacy-friendly (no user details exposed).
 * Used before customer joins to show "Currently X people waiting"
 */
const getQueuePreview = async (shopId) => {
    const queue = await prisma_1.default.queue.findUnique({
        where: { shopId }
    });
    if (!queue) {
        // Queue doesn't exist yet - shop might not have any customers
        return { customersWaiting: 0 };
    }
    // Count customers currently WAITING or SERVING (not completed/cancelled)
    const customersWaiting = await prisma_1.default.queueItem.count({
        where: {
            queueId: queue.id,
            status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] }
        }
    });
    return { customersWaiting };
};
exports.getQueuePreview = getQueuePreview;
const getShopQueue = async (shopId, skipStatusCheck = false) => {
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
                    services: { include: { durations: true } },
                    barbers: true,
                },
            },
        },
    });
    if (!queue)
        throw new AppError_1.AppError('Queue not found for this shop', 404);
    const status = (0, shopStatus_1.getShopStatus)(queue.shop);
    if (!skipStatusCheck && status !== shop_1.ShopStatus.ACTIVE && status !== shop_1.ShopStatus.PAUSED) {
        throw new AppError_1.AppError('This shop is not available for customers', 403);
    }
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
        status, // Added shop status
        metrics: {
            activeBarbers: activeBarbersCount,
            customersWaiting: waitingItems.length,
            estimatedWaitTime,
        }
    };
};
exports.getShopQueue = getShopQueue;
const joinQueue = async (shopId, customerId, serviceIds) => {
    console.log("[DEBUG SERVICE] joinQueue called:", { shopId, customerId, serviceIds });
    let newItem;
    newItem = await prisma_1.default.$transaction(async (tx) => {
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
        if (!shop)
            throw new AppError_1.AppError('Shop not found', 404);
        if (!shop.queue)
            throw new AppError_1.AppError('Queue not initialized for this shop', 400);
        const status = (0, shopStatus_1.getShopStatus)(shop);
        if (status !== shop_1.ShopStatus.ACTIVE) {
            if (status === shop_1.ShopStatus.PAUSED)
                throw new AppError_1.AppError('Queue is currently paused or no barbers available', 400);
            if (status === shop_1.ShopStatus.DRAFT)
                throw new AppError_1.AppError('Shop is incomplete and cannot accept customers', 400);
            throw new AppError_1.AppError('Shop is currently closed', 400);
        }
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
        if (services.length !== serviceIds.length)
            throw new AppError_1.AppError('Invalid services selected', 400);
        const itemDuration = services.reduce((acc, s) => acc + s.duration, 0);
        // Create item
        const newItem = await tx.queueItem.create({
            data: {
                queueId,
                customerId,
                status: client_1.QueueStatus.WAITING,
                tokenNumber: nextTokenNumber,
                estimatedWaitTime: 0, // Placeholder, can be updated or calculated dynamically
                services: {
                    connect: serviceIds.map(id => ({ id }))
                }
            }
        });
        console.log("[DEBUG SERVICE] Queue item created with tokenNumber:", newItem.tokenNumber);
        return newItem;
    });
    // Calculate current position after transaction completes (immediate calculation)
    const currentPosition = await (0, exports.calculateCurrentPosition)(newItem.id);
    // Return item with currentPosition attached
    const result = {
        ...newItem,
        currentPosition
    };
    console.log("[DEBUG SERVICE] Returning joinQueue result with currentPosition:", currentPosition);
    return result;
};
exports.joinQueue = joinQueue;
const joinWalkIn = async (shopId, walkInName, serviceIds) => {
    return await prisma_1.default.$transaction(async (tx) => {
        const shop = await tx.shop.findUnique({
            where: { id: shopId },
            include: { queue: true, services: { include: { durations: true } } }
        });
        if (!shop)
            throw new AppError_1.AppError('Shop not found', 404);
        if (!shop.queue)
            throw new AppError_1.AppError('Queue not initialized for this shop', 400);
        // Calculate token number for walk-in
        const lastItem = await tx.queueItem.findFirst({
            where: { queueId: shop.queue.id },
            orderBy: { tokenNumber: 'desc' }
        });
        const nextTokenNumber = (lastItem?.tokenNumber ?? 0) + 1;
        const services = await tx.serviceDuration.findMany({
            where: { id: { in: serviceIds } }
        });
        if (services.length !== serviceIds.length)
            throw new AppError_1.AppError('Invalid services selected', 400);
        const newItem = await tx.queueItem.create({
            data: {
                queueId: shop.queue.id,
                isWalkIn: true,
                walkInName,
                status: client_1.QueueStatus.WAITING,
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
exports.joinWalkIn = joinWalkIn;
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
        // If COMPLETED, log visit (only if customerId exists)
        if (status === client_1.QueueStatus.COMPLETED && barberId && item.customerId) {
            const totalPrice = item.services.reduce((acc, s) => acc + Number(s.price), 0);
            await tx.customerVisit.create({
                data: {
                    customerId: item.customerId,
                    barberId: barberId,
                    startTime: item.entryTime,
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
/**
 * Leave queue - customer cancels their queue entry
 * Constraints:
 * - Only the customer who created the item can leave
 * - Only if status is WAITING (not being served or already completed)
 * - Marks status as CANCELLED (does NOT delete)
 */
const leaveQueue = async (itemId, customerId) => {
    return await prisma_1.default.$transaction(async (tx) => {
        const item = await tx.queueItem.findUnique({
            where: { id: itemId },
            include: { queue: true }
        });
        if (!item)
            throw new AppError_1.AppError('Queue item not found', 404);
        // Only the customer who joined can leave
        if (item.customerId !== customerId) {
            throw new AppError_1.AppError('You can only leave your own queue entry', 403);
        }
        // Can only cancel if in WAITING status
        if (item.status !== client_1.QueueStatus.WAITING) {
            throw new AppError_1.AppError('Can only leave queue while waiting. You are already being served or have completed.', 400);
        }
        // Mark as CANCELLED instead of deleting
        const updatedItem = await tx.queueItem.update({
            where: { id: itemId },
            data: { status: client_1.QueueStatus.CANCELLED }
        });
        return updatedItem;
    });
};
exports.leaveQueue = leaveQueue;
