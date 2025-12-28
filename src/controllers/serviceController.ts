import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const createService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, name, description, durations } = req.body;

    // durations: [{ name, duration, price }]

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

export const getServices = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const services = await prisma.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
    res.status(200).json({ status: 'success', data: services });
});
