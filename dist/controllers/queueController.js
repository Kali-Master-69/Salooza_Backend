"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCustomerQueue = exports.addWalkIn = exports.toggleQueuePause = exports.updateStatus = exports.joinQueue = exports.getMyQueue = exports.getQueue = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const queueService = __importStar(require("../services/queueService"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const shopStatus_1 = require("../utils/shopStatus");
const shop_1 = require("../types/shop");
exports.getQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});
exports.getMyQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId: req.user.id }
    });
    if (!barber)
        return next(new AppError_1.AppError('Barber not found', 404));
    const queue = await queueService.getShopQueue(barber.shopId, true);
    res.status(200).json({ status: 'success', data: queue });
});
exports.joinQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId, serviceIds } = req.body;
    if (!req.user || req.user.role !== 'CUSTOMER') {
        return next(new AppError_1.AppError('Only customers can join queue', 403));
    }
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer)
        throw new AppError_1.AppError('Customer profile not found', 404);
    const item = await queueService.joinQueue(shopId, customer.id, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});
exports.updateStatus = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { itemId } = req.params;
    const { status } = req.body;
    // Barber ID needed if completing
    let barberId;
    if (req.user?.role === 'BARBER') {
        const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
        barberId = barber?.id;
    }
    const updated = await queueService.updateQueueItemStatus(itemId, status, barberId);
    res.status(200).json({ status: 'success', data: updated });
});
exports.toggleQueuePause = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId: req.user.id }
    });
    if (!barber)
        return next(new AppError_1.AppError('Only barbers can manage their queue', 403));
    // Check shop state
    const shop = await prisma_1.default.shop.findUnique({
        where: { id: barber.shopId },
        include: { services: { include: { durations: true } }, barbers: true, queue: true }
    });
    if (!shop)
        return next(new AppError_1.AppError('Shop not found', 404));
    const status = (0, shopStatus_1.getShopStatus)(shop);
    if (status === shop_1.ShopStatus.DRAFT) {
        return next(new AppError_1.AppError('Setup your shop profile and services before managing the queue', 400));
    }
    const { isPaused } = req.body;
    const queue = await prisma_1.default.queue.update({
        where: { shopId: barber.shopId },
        data: { isPaused }
    });
    res.status(200).json({ status: 'success', data: queue });
});
exports.addWalkIn = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user || req.user.role !== 'BARBER') {
        return next(new AppError_1.AppError('Only barbers can add walk-ins', 403));
    }
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId: req.user.id }
    });
    if (!barber)
        return next(new AppError_1.AppError('Barber not found', 404));
    const { walkInName, serviceIds } = req.body;
    if (!walkInName || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError_1.AppError('Walk-in name and service IDs are required', 400));
    }
    const item = await queueService.joinWalkIn(barber.shopId, walkInName, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});
exports.getMyCustomerQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user || req.user.role !== 'CUSTOMER') {
        return next(new AppError_1.AppError('Only customers can access their queue status', 403));
    }
    const customer = await prisma_1.default.customer.findUnique({
        where: { userId: req.user.id }
    });
    if (!customer)
        return next(new AppError_1.AppError('Customer profile not found', 404));
    const item = await prisma_1.default.queueItem.findFirst({
        where: {
            customerId: customer.id,
            status: { in: [client_1.QueueStatus.WAITING, client_1.QueueStatus.SERVING] }
        },
        include: {
            services: { include: { service: true } },
            queue: { include: { shop: true } }
        }
    });
    if (!item) {
        return res.status(200).json({ status: 'success', data: null });
    }
    // Calculate current position dynamically (not stored in DB)
    const currentPosition = await queueService.calculateCurrentPosition(item.id);
    // Get full queue for wait time
    const fullQueue = await queueService.getShopQueue(item.queue.shopId);
    const peopleAhead = currentPosition - 1;
    res.status(200).json({
        status: 'success',
        data: {
            item: {
                ...item,
                currentPosition // Add dynamic position to item
            },
            shop: item.queue.shop,
            currentPosition, // Include at top level for convenience
            tokenNumber: item.tokenNumber, // Keep static token for reference
            estimatedWaitTime: fullQueue.metrics.estimatedWaitTime,
            peopleAhead,
            fullQueue: fullQueue.items
        }
    });
});
