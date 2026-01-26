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
exports.updateShop = exports.getShop = exports.getMyShop = exports.getShops = exports.createShop = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const shopStatus_1 = require("../utils/shopStatus");
const shop_1 = require("../types/shop");
const shopService = __importStar(require("../services/shopService"));
exports.createShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, address, openTime, closeTime } = req.body;
    const shop = await shopService.createShop({ name, address, openTime, closeTime });
    res.status(201).json({ status: 'success', data: shop });
});
exports.getShops = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const shops = await shopService.getShops();
    const activeShops = shops
        .filter(shop => (0, shopStatus_1.getShopStatus)(shop) === shop_1.ShopStatus.ACTIVE)
        .map(shop => ({
        ...shop,
        status: shop_1.ShopStatus.ACTIVE // Explicitly set for frontend
    }));
    res.status(200).json({ status: 'success', data: activeShops });
});
exports.getMyShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop)
        return next(new AppError_1.AppError('Shop not found', 404));
    const status = (0, shopStatus_1.getShopStatus)(shop);
    res.status(200).json({
        status: 'success',
        data: { ...shop, status }
    });
});
exports.getShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const shop = await shopService.getShopById(id);
    if (!shop)
        return next(new AppError_1.AppError('Shop not found', 404));
    const status = (0, shopStatus_1.getShopStatus)(shop);
    // For specific shop retrieval, we allow ACTIVE and PAUSED (visible but maybe not joinable)
    if (status === shop_1.ShopStatus.DRAFT || status === shop_1.ShopStatus.HIDDEN) {
        return next(new AppError_1.AppError('Shop is not currently available', 403));
    }
    res.status(200).json({ status: 'success', data: { ...shop, status } });
});
exports.updateShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new AppError_1.AppError('Unauthorized', 401));
    // Check if the user is a shop owner
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop)
        return next(new AppError_1.AppError('Only shop owners can update their shop', 403));
    const updatedShop = await shopService.updateShop(shop.id, req.body);
    res.status(200).json({ status: 'success', data: updatedShop });
});
