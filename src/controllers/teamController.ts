import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync'; // Assuming this exists or I use try-catch
import * as teamService from '../services/teamService';
import { AppError } from '../utils/AppError';

// Quick helper if catchAsync is not exported (it was used in authController)
// Re-implementing just in case import fails or to be safe
const catchAsyncFn = (fn: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

export const createInvite = catchAsyncFn(async (req: Request, res: Response, next: NextFunction) => {
    // Assumes protect middleware has run and req.user exists
    if (!req.user) return next(new AppError('Not authenticated', 401));

    const result = await teamService.generateInvite(req.user.id);

    res.status(201).json({
        status: 'success',
        data: result
    });
});

export const validateInvite = catchAsyncFn(async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.params;
    const result = await teamService.validateInvite(code);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

export const acceptInvite = catchAsyncFn(async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.params;
    const { email, password, name, phone } = req.body;

    const result = await teamService.acceptBarberInvite(code, {
        email,
        password,
        name,
        phone
    });

    res.status(201).json({
        status: 'success',
        token: result.token,
        data: {
            user: result.user,
            barber: result.barber
        }
    });
});
