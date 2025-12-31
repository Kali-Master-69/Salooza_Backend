import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const createService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let { shopId, name, description, durations } = req.body;

    if (req.user?.role === 'BARBER') {
        const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber) return next(new AppError('Barber not found', 404));
        shopId = barber.shopId;
    }

    if (!shopId) return next(new AppError('Shop ID is required', 400));

    const service = await prisma.service.create({
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

export const updateService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, durations } = req.body;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return next(new AppError('Service not found', 404));

    // Security: Check if barber owns the shop
    if (req.user?.role === 'BARBER') {
        const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber || barber.shopId !== service.shopId) {
            return next(new AppError('Unauthorized', 403));
        }
    }

    const updated = await prisma.service.update({
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

export const deleteService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return next(new AppError('Service not found', 404));

    if (req.user?.role === 'BARBER') {
        const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
        if (!barber || barber.shopId !== service.shopId) {
            return next(new AppError('Unauthorized', 403));
        }
    }

    await prisma.service.delete({ where: { id } });

    res.status(204).json({ status: 'success', data: null });
});


export const getServices = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const services = await prisma.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
    res.status(200).json({ status: 'success', data: services });
});
