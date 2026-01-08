import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';
import * as shopService from '../services/shopService';

export const createShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, address, openTime, closeTime } = req.body;
    const shop = await shopService.createShop({ name, address, openTime, closeTime });
    res.status(201).json({ status: 'success', data: shop });
});

export const getShops = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const shops = await shopService.getShops();

    const activeShops = shops
        .filter(shop => getShopStatus(shop) === ShopStatus.ACTIVE)
        .map(shop => ({
            ...shop,
            status: ShopStatus.ACTIVE // Explicitly set for frontend
        }));

    res.status(200).json({ status: 'success', data: activeShops });
});

export const getMyShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) return next(new AppError('Shop not found', 404));

    const status = getShopStatus(shop);

    res.status(200).json({
        status: 'success',
        data: { ...shop, status }
    });
});

export const getShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const shop = await shopService.getShopById(id);

    if (!shop) return next(new AppError('Shop not found', 404));

    const status = getShopStatus(shop);

    // For specific shop retrieval, we allow ACTIVE and PAUSED (visible but maybe not joinable)
    if (status === ShopStatus.DRAFT || status === ShopStatus.HIDDEN) {
        return next(new AppError('Shop is not currently available', 403));
    }

    res.status(200).json({ status: 'success', data: { ...shop, status } });
});

export const updateShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    // We still check if the user is a barber here or we can move it to middleware/service
    // For now, let's keep it simple.
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) return next(new AppError('Only barbers can update their shop', 403));

    const updatedShop = await shopService.updateShop(shop.id, req.body);

    res.status(200).json({ status: 'success', data: updatedShop });
});


