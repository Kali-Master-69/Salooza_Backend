"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShops = exports.createShop = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
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
        where: { isActive: true },
        include: { queue: true }
    });
    res.status(200).json({ status: 'success', data: shops });
});
