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
exports.getQueuePreview = exports.leaveQueue = exports.getMyCustomerQueue = exports.toggleQueuePause = exports.updateStatus = exports.addWalkIn = exports.joinQueue = exports.getMyQueue = exports.getQueue = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const queueService = __importStar(require("../services/queueService"));
const shopService = __importStar(require("../services/shopService"));
const shopOwnerService = __importStar(require("../services/shopOwnerService"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
exports.getQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});
exports.getMyQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop)
        return next(new AppError_1.AppError('Shop not found for this user', 404));
    // skipStatusCheck = true because owner/barber should see queue even if PAUSED or CLOSED
    const queue = await queueService.getShopQueue(shop.id, true);
    res.status(200).json({ status: 'success', data: queue });
});
exports.joinQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer)
        return next(new AppError_1.AppError('Customer profile not found', 404));
    const { shopId, serviceIds } = req.body;
    if (!shopId || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError_1.AppError('Please provide shopId and serviceIds', 400));
    }
    const item = await queueService.joinQueue(shopId, customer.id, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});
exports.addWalkIn = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop)
        return next(new AppError_1.AppError('Shop not found for this user', 404));
    const { name, serviceIds } = req.body;
    if (!name || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError_1.AppError('Please provide name and serviceIds', 400));
    }
    const item = await queueService.joinWalkIn(shop.id, name, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});
exports.updateStatus = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { itemId } = req.params;
    const { status } = req.body;
    if (!Object.values(client_1.QueueStatus).includes(status)) {
        return next(new AppError_1.AppError('Invalid status', 400));
    }
    let shopOwnerId;
    let barberId;
    if (req.user?.role === 'SHOP_OWNER') {
        const owner = await shopOwnerService.getShopOwnerByUserId(req.user.id);
        shopOwnerId = owner?.id;
    }
    else if (req.user?.role === 'BARBER') {
        const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
        barberId = barber?.id;
    }
    // Pass both. One might be undefined.
    const updated = await queueService.updateQueueItemStatus(itemId, status, shopOwnerId, barberId);
    res.status(200).json({ status: 'success', data: updated });
});
exports.toggleQueuePause = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop)
        return next(new AppError_1.AppError('Shop not found for this user', 404));
    // Only shop owner can pause? 
    // Logic in service checks shopId, but typically only Owner should call this.
    // The route restriction handles Role check.
    const { isPaused } = req.body;
    if (typeof isPaused !== 'boolean')
        return next(new AppError_1.AppError('isPaused must be boolean', 400));
    const updated = await queueService.toggleQueuePause(shop.id, isPaused);
    res.status(200).json({ status: 'success', data: updated });
});
exports.getMyCustomerQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer)
        return next(new AppError_1.AppError('Customer not found', 404));
    const item = await queueService.getCustomerActiveQueueItem(customer.id);
    res.status(200).json({
        status: 'success',
        data: item // Can be null if not in queue
    });
});
exports.leaveQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { itemId } = req.params;
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer)
        return next(new AppError_1.AppError('Customer not found', 404));
    // Service checks if item belongs to customer
    await queueService.leaveQueue(itemId, customer.id);
    res.status(200).json({ status: 'success', data: null });
});
exports.getQueuePreview = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const preview = await queueService.getQueuePreview(shopId);
    res.status(200).json({ status: 'success', data: preview });
});
