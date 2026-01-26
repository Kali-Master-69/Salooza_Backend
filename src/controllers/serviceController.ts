import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as shopService from '../services/shopService';

export const createService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let { shopId, name, description, durations } = req.body;

    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop) return next(new AppError('Shop not found for this owner', 404));
        shopId = shop.id;
    }

    if (!shopId) return next(new AppError('Shop ID is required', 400));

    const service = await shopService.createService({
        shopId,
        name,
        description,
        durations
    });

    res.status(201).json({ status: 'success', data: service });
});

export const updateService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, durations } = req.body;

    const service = await shopService.getServiceById(id);
    if (!service) return next(new AppError('Service not found', 404));

    // Security: Check if shop owner owns the shop
    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop || shop.id !== service.shopId) {
            return next(new AppError('Unauthorized', 403));
        }
    }

    const updated = await shopService.updateService(id, { name, description, durations });

    res.status(200).json({ status: 'success', data: updated });
});

export const deleteService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const service = await shopService.getServiceById(id);
    if (!service) return next(new AppError('Service not found', 404));

    if (req.user?.role === 'SHOP_OWNER') {
        const shop = await shopService.getShopByUserId(req.user.id);
        if (!shop || shop.id !== service.shopId) {
            return next(new AppError('Unauthorized', 403));
        }
    }

    await shopService.deleteService(id);

    res.status(204).json({ status: 'success', data: null });
});


export const getServices = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { shopId } = req.params;
    const services = await shopService.getServicesByShopId(shopId);
    res.status(200).json({ status: 'success', data: services });
});
