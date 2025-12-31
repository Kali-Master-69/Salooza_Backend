"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = exports.deleteService = exports.updateService = exports.createService = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
exports.createService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let { shopId, name, description, durations } = req.body;
    if (req.user?.role === 'BARBER') {
        const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber)
            return next(new AppError_1.AppError('Barber not found', 404));
        shopId = barber.shopId;
    }
    if (!shopId)
        return next(new AppError_1.AppError('Shop ID is required', 400));
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
exports.updateService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { name, description, durations } = req.body;
    const service = await prisma_1.default.service.findUnique({ where: { id } });
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    // Security: Check if barber owns the shop
    if (req.user?.role === 'BARBER') {
        const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber || barber.shopId !== service.shopId) {
            return next(new AppError_1.AppError('Unauthorized', 403));
        }
    }
    const updated = await prisma_1.default.service.update({
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
    res.status(200).json({ status: 'success', data: updated });
});
exports.deleteService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const service = await prisma_1.default.service.findUnique({ where: { id } });
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    if (req.user?.role === 'BARBER') {
        const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber || barber.shopId !== service.shopId) {
            return next(new AppError_1.AppError('Unauthorized', 403));
        }
    }
    await prisma_1.default.service.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
});
exports.getServices = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { shopId } = req.params;
    const services = await prisma_1.default.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
    res.status(200).json({ status: 'success', data: services });
});
