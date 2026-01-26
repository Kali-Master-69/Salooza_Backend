"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServicesByShopId = exports.getServiceById = exports.deleteService = exports.updateService = exports.createService = exports.getServiceDurations = exports.getShopByUserId = exports.updateShop = exports.getShopById = exports.getShops = exports.createShop = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
const shopStatus_1 = require("../utils/shopStatus");
const shop_1 = require("../types/shop");
const createShop = async (data, tx) => {
    const client = tx || prisma_1.default;
    return await client.shop.create({
        data: {
            ...data,
            queue: {
                create: {} // Create empty queue for the shop
            }
        },
        include: { queue: true }
    });
};
exports.createShop = createShop;
const getShops = async (tx) => {
    const client = tx || prisma_1.default;
    return await client.shop.findMany({
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            owner: true,
            barbers: true
        }
    });
};
exports.getShops = getShops;
const getShopById = async (id, tx) => {
    const client = tx || prisma_1.default;
    return await client.shop.findUnique({
        where: { id },
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            owner: true,
            barbers: true
        }
    });
};
exports.getShopById = getShopById;
const updateShop = async (shopId, data, tx) => {
    const client = tx || prisma_1.default;
    const { isActive, name, address, openTime, closeTime } = data;
    // If attempting to go live, validate state
    if (isActive === true) {
        const currentShop = await (0, exports.getShopById)(shopId, tx);
        if (!currentShop)
            throw new AppError_1.AppError('Shop not found', 404);
        const prospectiveShop = {
            ...currentShop,
            name: name !== undefined ? name : currentShop.name,
            address: address !== undefined ? address : currentShop.address,
        };
        if ((0, shopStatus_1.getShopStatus)(prospectiveShop) === shop_1.ShopStatus.DRAFT) {
            throw new AppError_1.AppError('Cannot go live with an incomplete profile or no services', 400);
        }
    }
    return await client.shop.update({
        where: { id: shopId },
        data: { name, address, openTime, closeTime, isActive }
    });
};
exports.updateShop = updateShop;
const getShopByUserId = async (userId) => {
    // 1. Check if user is a Shop Owner
    const shopOwner = await prisma_1.default.shopOwner.findUnique({
        where: { userId },
        include: {
            shop: {
                include: {
                    queue: true,
                    services: {
                        include: {
                            durations: true
                        }
                    },
                    owner: true,
                    barbers: true
                }
            }
        }
    });
    if (shopOwner) {
        return shopOwner.shop;
    }
    // 2. Check if user is a Barber
    const barber = await prisma_1.default.barber.findUnique({
        where: { userId },
        include: {
            shop: {
                include: {
                    queue: true,
                    services: {
                        include: {
                            durations: true
                        }
                    },
                    owner: true,
                    barbers: true
                }
            }
        }
    });
    if (barber) {
        return barber.shop;
    }
    return null;
};
exports.getShopByUserId = getShopByUserId;
const getServiceDurations = async (ids) => {
    return await prisma_1.default.serviceDuration.findMany({
        where: { id: { in: ids } }
    });
};
exports.getServiceDurations = getServiceDurations;
const createService = async (data) => {
    const { shopId, name, description, durations } = data;
    return await prisma_1.default.service.create({
        data: {
            shopId,
            name,
            description,
            durations: {
                create: durations
            }
        },
        include: { durations: true }
    });
};
exports.createService = createService;
const updateService = async (id, data) => {
    const { name, description, durations } = data;
    return await prisma_1.default.service.update({
        where: { id },
        data: {
            name,
            description,
            durations: durations ? {
                deleteMany: {},
                create: durations
            } : undefined
        },
        include: { durations: true }
    });
};
exports.updateService = updateService;
const deleteService = async (id) => {
    return await prisma_1.default.service.delete({ where: { id } });
};
exports.deleteService = deleteService;
const getServiceById = async (id) => {
    return await prisma_1.default.service.findUnique({ where: { id } });
};
exports.getServiceById = getServiceById;
const getServicesByShopId = async (shopId) => {
    return await prisma_1.default.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
};
exports.getServicesByShopId = getServicesByShopId;
