import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as queueService from '../services/queueService';
import { QueueStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';


export const getQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});

export const getMyQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const barber = await prisma.barber.findUnique({
        where: { userId: req.user.id }
    });

    if (!barber) return next(new AppError('Barber not found', 404));

    const queue = await queueService.getShopQueue(barber.shopId, true);


    res.status(200).json({ status: 'success', data: queue });
});

export const joinQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, serviceIds } = req.body;

    // Validate required fields
    if (!shopId || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError('shopId and serviceIds array are required', 400));
    }

    if (!req.user || req.user.role !== 'CUSTOMER') {
        return next(new AppError('Only customers can join queue', 403));
    }

    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer) throw new AppError('Customer profile not found', 404);

    const item = await queueService.joinQueue(shopId, customer.id, serviceIds);
    
    // Ensure tokenNumber is in response
    res.status(201).json({ 
        status: 'success', 
        data: {
            ...item,
            tokenNumber: item.tokenNumber
        }
    });
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

export const toggleQueuePause = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const barber = await prisma.barber.findUnique({
        where: { userId: req.user.id }
    });

    if (!barber) return next(new AppError('Only barbers can manage their queue', 403));

    // Check shop state
    const shop = await prisma.shop.findUnique({
        where: { id: barber.shopId },
        include: { services: { include: { durations: true } }, barbers: true, queue: true }
    });

    if (!shop) return next(new AppError('Shop not found', 404));

    const status = getShopStatus(shop);
    if (status === ShopStatus.DRAFT) {
        return next(new AppError('Setup your shop profile and services before managing the queue', 400));
    }

    const { isPaused } = req.body;


    const queue = await prisma.queue.update({
        where: { shopId: barber.shopId },
        data: { isPaused }
    });

    res.status(200).json({ status: 'success', data: queue });
});
export const addWalkIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'BARBER') {
        return next(new AppError('Only barbers can add walk-ins', 403));
    }

    const barber = await prisma.barber.findUnique({
        where: { userId: req.user.id }
    });

    if (!barber) return next(new AppError('Barber not found', 404));

    const { walkInName, serviceIds } = req.body;

    if (!walkInName || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError('Walk-in name and service IDs are required', 400));
    }

    const item = await queueService.joinWalkIn(barber.shopId, walkInName, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});

export const getMyCustomerQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'CUSTOMER') {
        return next(new AppError('Only customers can access their queue status', 403));
    }

    const customer = await prisma.customer.findUnique({
        where: { userId: req.user.id }
    });

    if (!customer) return next(new AppError('Customer profile not found', 404));

    const item = await prisma.queueItem.findFirst({
        where: {
            customerId: customer.id,
            status: { in: [QueueStatus.WAITING, QueueStatus.SERVING] }
        },
        include: {
            services: { include: { service: true } },
            queue: { include: { shop: true } }
        }
    });

    if (!item) {
        return res.status(200).json({ status: 'success', data: null });
    }

    // Calculate current position dynamically (not stored in DB)
    const currentPosition = await queueService.calculateCurrentPosition(item.id);

    // Get full queue for wait time
    const fullQueue = await queueService.getShopQueue(item.queue.shopId);
    const peopleAhead = currentPosition - 1;

    res.status(200).json({
        status: 'success',
        data: {
            item: {
                ...item,
                currentPosition // Add dynamic position to item
            },
            shop: item.queue.shop,
            currentPosition, // Include at top level for convenience
            tokenNumber: item.tokenNumber, // Keep static token for reference
            estimatedWaitTime: fullQueue.metrics.estimatedWaitTime,
            peopleAhead,
            fullQueue: fullQueue.items
        }
    });
});
