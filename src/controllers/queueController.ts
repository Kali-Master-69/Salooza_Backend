import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as queueService from '../services/queueService';
import * as shopService from '../services/shopService';
import * as shopOwnerService from '../services/shopOwnerService';
import prisma from '../utils/prisma';
import { QueueStatus } from '@prisma/client';

export const getQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const queue = await queueService.getShopQueue(shopId);
    res.status(200).json({ status: 'success', data: queue });
});

export const getMyQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) return next(new AppError('Shop not found for this user', 404));

    // skipStatusCheck = true because owner/barber should see queue even if PAUSED or CLOSED
    const queue = await queueService.getShopQueue(shop.id, true);
    res.status(200).json({ status: 'success', data: queue });
});

export const joinQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer) return next(new AppError('Customer profile not found', 404));

    const { shopId, serviceIds } = req.body;
    if (!shopId || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError('Please provide shopId and serviceIds', 400));
    }

    const item = await queueService.joinQueue(shopId, customer.id, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});

export const addWalkIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) return next(new AppError('Shop not found for this user', 404));

    const { name, serviceIds } = req.body;
    if (!name || !serviceIds || !Array.isArray(serviceIds)) {
        return next(new AppError('Please provide name and serviceIds', 400));
    }

    const item = await queueService.joinWalkIn(shop.id, name, serviceIds);
    res.status(201).json({ status: 'success', data: item });
});


export const updateStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { itemId } = req.params;
    const { status } = req.body;

    if (!Object.values(QueueStatus).includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    let shopOwnerId: string | undefined;
    let barberId: string | undefined;

    if (req.user?.role === 'SHOP_OWNER') {
        const owner = await shopOwnerService.getShopOwnerByUserId(req.user.id);
        shopOwnerId = owner?.id;
    } else if (req.user?.role === 'BARBER') {
        const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
        barberId = barber?.id;
    }

    // Pass both. One might be undefined.
    const updated = await queueService.updateQueueItemStatus(itemId, status, shopOwnerId, barberId);
    res.status(200).json({ status: 'success', data: updated });
});

export const toggleQueuePause = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) return next(new AppError('Shop not found for this user', 404));

    // Only shop owner can pause? 
    // Logic in service checks shopId, but typically only Owner should call this.
    // The route restriction handles Role check.

    const { isPaused } = req.body;
    if (typeof isPaused !== 'boolean') return next(new AppError('isPaused must be boolean', 400));

    const updated = await queueService.toggleQueuePause(shop.id, isPaused);
    res.status(200).json({ status: 'success', data: updated });
});

export const getMyCustomerQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer) return next(new AppError('Customer not found', 404));

    const item = await queueService.getCustomerActiveQueueItem(customer.id);

    res.status(200).json({
        status: 'success',
        data: item // Can be null if not in queue
    });
});

export const leaveQueue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { itemId } = req.params;
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    if (!customer) return next(new AppError('Customer not found', 404));

    // Service checks if item belongs to customer
    await queueService.leaveQueue(itemId, customer.id);
    res.status(200).json({ status: 'success', data: null });
});


export const getQueuePreview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const preview = await queueService.getQueuePreview(shopId);
    res.status(200).json({ status: 'success', data: preview });
});
