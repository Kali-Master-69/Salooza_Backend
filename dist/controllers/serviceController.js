"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = exports.createService = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.createService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId, name, description, durations } = req.body;
    // durations: [{ name, duration, price }]
    const service = await prisma_1.default.service.create({
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
    res.status(201).json({ status: 'success', data: service });
});
exports.getServices = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const services = await prisma_1.default.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
    res.status(200).json({ status: 'success', data: services });
});
