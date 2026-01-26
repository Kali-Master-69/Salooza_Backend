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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = exports.deleteService = exports.updateService = exports.createService = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const shopService = __importStar(require("../services/shopService"));
exports.createService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let { shopId, name, description, durations } = req.body;
    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop)
            return next(new AppError_1.AppError('Shop not found for this owner', 404));
        shopId = shop.id;
    }
    if (!shopId)
        return next(new AppError_1.AppError('Shop ID is required', 400));
    const service = await shopService.createService({
        shopId,
        name,
        description,
        durations
    });
    res.status(201).json({ status: 'success', data: service });
});
exports.updateService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, durations } = req.body;
    const service = await shopService.getServiceById(id);
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    // Security: Check if shop owner owns the shop
    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop || shop.id !== service.shopId) {
            return next(new AppError_1.AppError('Unauthorized', 403));
        }
    }
    const updated = await shopService.updateService(id, { name, description, durations });
    res.status(200).json({ status: 'success', data: updated });
});
exports.deleteService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const service = await shopService.getServiceById(id);
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop || shop.id !== service.shopId) {
            return next(new AppError_1.AppError('Unauthorized', 403));
        }
    }
    await shopService.deleteService(id);
    res.status(204).json({ status: 'success', data: null });
});
exports.getServices = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const services = await shopService.getServicesByShopId(shopId);
    res.status(200).json({ status: 'success', data: services });
});
