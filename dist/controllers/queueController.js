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
exports.updateStatus = exports.joinQueue = exports.getQueue = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const queueService = __importStar(require("../services/queueService"));
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});
exports.joinQueue = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.body; // or params
    const { serviceIds } = req.body;
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const customerId = req.user.id;
    // Helper to find customer profile
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: customerId } });
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
