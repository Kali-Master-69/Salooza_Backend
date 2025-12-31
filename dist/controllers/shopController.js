"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShop = exports.getShop = exports.getMyShop = exports.getShops = exports.createShop = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
const shopStatus_1 = require("../utils/shopStatus");
const shop_1 = require("../types/shop");
exports.createShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, address, openTime, closeTime } = req.body;
    const shop = await prisma_1.default.shop.create({
        data: {
            name,
            address,
            openTime,
            closeTime,
            queue: {
                create: {} // Create empty queue for the shop
            }
        },
        include: { queue: true }
    });
    res.status(201).json({ status: 'success', data: shop });
});
exports.getShops = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const shops = await prisma_1.default.shop.findMany({
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            barbers: true
        }
    });
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
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId: req.user.id },
        include: { shop: { include: { queue: true } } }
    });
    if (!barber)
        return next(new AppError_1.AppError('Barber not found', 404));
    const shop = barber.shop;
    const services = await prisma_1.default.service.findMany({
        where: { shopId: shop.id },
        include: { durations: true }
    });
    const barbers = await prisma_1.default.barber.findMany({
        where: { shopId: shop.id }
    });
    const status = (0, shopStatus_1.getShopStatus)({ ...shop, services, barbers });
    res.status(200).json({
        status: 'success',
        data: { ...shop, status, services, barbers }
    });
});
exports.getShop = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const shop = await prisma_1.default.shop.findUnique({
        where: { id },
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            barbers: true
        }
    });
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
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId: req.user.id }
    });
    if (!barber)
        return next(new AppError_1.AppError('Only barbers can update their shop', 403));
    const { name, address, openTime, closeTime, isActive } = req.body;
    // If attempting to go live, validate state
    if (isActive === true) {
        const currentShop = await prisma_1.default.shop.findUnique({
            where: { id: barber.shopId },
            include: { services: { include: { durations: true } }, barbers: true, queue: true }
        });
        if (!currentShop)
            return next(new AppError_1.AppError('Shop not found', 404));
        // Create a temporary object with prospective updates to check if it WOULD be DRAFT
        const prospectiveShop = {
            ...currentShop,
            name: name !== undefined ? name : currentShop.name,
            address: address !== undefined ? address : currentShop.address,
        };
        if ((0, shopStatus_1.getShopStatus)(prospectiveShop) === shop_1.ShopStatus.DRAFT) {
            return next(new AppError_1.AppError('Cannot go live with an incomplete profile or no services', 400));
        }
    }
    const shop = await prisma_1.default.shop.update({
        where: { id: barber.shopId },
        data: { name, address, openTime, closeTime, isActive }
    });
    res.status(200).json({ status: 'success', data: shop });
});
