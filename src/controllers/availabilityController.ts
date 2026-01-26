import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as shopOwnerService from '../services/shopOwnerService';
import { AppError } from '../utils/AppError';

export const updateAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    // Only Shop Owner can update their own availability
    const shopOwner = await shopOwnerService.getShopOwnerByUserId(req.user.id);
    if (!shopOwner) {
        return next(new AppError('Shop Owner profile not found', 404));
    }

    const { isAvailable } = req.body;

    const updated = await shopOwnerService.updateShopOwnerAvailability(shopOwner.id, isAvailable);

    res.status(200).json({ status: 'success', data: updated });
});
