import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as shopOwnerService from '../services/shopOwnerService';
import * as barberService from '../services/barberService';
import * as shopService from '../services/shopService';


import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';


export const updateAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    // Only Shop Owner can update the SHOP availability
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) {
        return next(new AppError('Shop not found for this owner', 404));
    }

    const { isAvailable } = req.body; // isAvailable here corresponds to shop's active status

    const updated = await shopService.updateShop(shop.id, { isActive: isAvailable });

    res.status(200).json({ status: 'success', data: updated });
});


export const updateBarberAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const { isAvailable } = req.body;
    let updated;

    if (req.user.role === Role.BARBER) {
        const barber = await barberService.getBarberByUserId(req.user.id);
        if (!barber) return next(new AppError('Barber profile not found', 404));
        updated = await barberService.updateBarberAvailability(barber.id, isAvailable);
    } else if (req.user.role === Role.SHOP_OWNER) {
        const shopOwner = await shopOwnerService.getShopOwnerByUserId(req.user.id);
        if (!shopOwner) return next(new AppError('Shop Owner profile not found', 404));
        updated = await shopOwnerService.updateShopOwnerAvailability(shopOwner.id, isAvailable);
    } else {
        return next(new AppError('Unauthorized', 403));
    }

    res.status(200).json({ status: 'success', data: updated });
});


