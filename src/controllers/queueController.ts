import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as queueService from '../services/queueService';
import { QueueStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});

export const joinQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.body; // or params
    const { serviceIds } = req.body;

    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const customerId = req.user.id;

    // Helper to find customer profile
    const customer = await prisma.customer.findUnique({ where: { userId: customerId } });

    if (!customer) throw new AppError('Customer profile not found', 404);

    const item = await queueService.joinQueue(shopId, customer.id, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});

export const updateStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { itemId } = req.params;
    const { status } = req.body;

    // Barber ID needed if completing
    let barberId;
    if (req.user?.role === 'BARBER') {
        const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
        barberId = barber?.id;
    }

    const updated = await queueService.updateQueueItemStatus(itemId, status as QueueStatus, barberId);
    res.status(200).json({ status: 'success', data: updated });
});
