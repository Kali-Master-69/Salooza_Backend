import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as barberService from '../services/barberService';
import { AppError } from '../utils/AppError';

export const updateAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    // Only Barber can update their own availability
    const barber = await barberService.getBarberByUserId(req.user.id);
    if (!barber) {
        return next(new AppError('Barber profile not found', 404));
    }

    const { isAvailable } = req.body;

    const updated = await barberService.updateBarberAvailability(barber.id, isAvailable);

    res.status(200).json({ status: 'success', data: updated });
});

