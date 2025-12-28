import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/auth';
import prisma from '../utils/prisma'; // Optional: if we want to check if user still exists
import { Role } from '@prisma/client';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = verifyToken(token);

        // Check if user still exists
        const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer does exist.', 401));
        }

        req.user = {
            id: currentUser.id,
            role: currentUser.role,
        };
        next();
    } catch (error) {
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
};

export const restrictTo = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
