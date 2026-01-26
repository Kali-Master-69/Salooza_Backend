import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { registerUser, loginUser, getUserProfile } from '../services/authService';
import { registerSchema, loginSchema } from '../validators/authValidators';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';


export const registerCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = registerSchema.parse({ ...req.body, role: 'CUSTOMER' });
    const { user, token } = await registerUser(data, Role.CUSTOMER);
    res.status(201).json({ status: 'success', token, data: { user } });
});

export const loginCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);
    const { user, token } = await loginUser(data, Role.CUSTOMER);
    res.status(200).json({ status: 'success', token, data: { user } });
});

export const registerShopOwner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = registerSchema.parse({ ...req.body, role: 'SHOP_OWNER' });
    const { user, token } = await registerUser(data, Role.SHOP_OWNER);
    res.status(201).json({ status: 'success', token, data: { user } });
});

export const loginShopOwner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);
    const { user, token } = await loginUser(data, Role.SHOP_OWNER);
    res.status(200).json({ status: 'success', token, data: { user } });
});

export const registerAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = registerSchema.parse({ ...req.body, role: 'ADMIN' });
    const { user, token } = await registerUser(data, Role.ADMIN);
    res.status(201).json({ status: 'success', token, data: { user } });
});

export const loginAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);
    const { user, token } = await loginUser(data, Role.ADMIN);
    res.status(200).json({ status: 'success', token, data: { user } });
});

export const loginCommon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = loginSchema.parse(req.body);
    // Don't pass role, allowing auto-detection
    const { user, token } = await loginUser(data);
    res.status(200).json({ status: 'success', token, data: { user } });
});

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not found', 404));
    }

    const user = await getUserProfile(req.user.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});
