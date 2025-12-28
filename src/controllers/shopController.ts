import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';

export const createShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, address, openTime, closeTime } = req.body;

    const shop = await prisma.shop.create({
        data: {
            name,
            address,
            openTime,
            closeTime,
            queue: {
                create: {} // Create empty queue for the shop
            }
        },
        include: { queue: true }
    });

    res.status(201).json({ status: 'success', data: shop });
});

export const getShops = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const shops = await prisma.shop.findMany({
        where: { isActive: true },
        include: { queue: true }
    });
    res.status(200).json({ status: 'success', data: shops });
});
