import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';



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
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            barbers: true
        }
    });

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

    const barber = await prisma.barber.findUnique({
        where: { userId: req.user.id },
        include: { shop: { include: { queue: true } } }
    });

    if (!barber) return next(new AppError('Barber not found', 404));

    const shop = barber.shop;
    const services = await prisma.service.findMany({
        where: { shopId: shop.id },
        include: { durations: true }
    });
    const barbers = await prisma.barber.findMany({
        where: { shopId: shop.id }
    });

    const status = getShopStatus({ ...shop, services, barbers });

    res.status(200).json({
        status: 'success',
        data: { ...shop, status, services, barbers }
    });
});

export const getShop = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const shop = await prisma.shop.findUnique({
        where: { id },
        include: {
            queue: true,
            services: {
                include: {
                    durations: true
                }
            },
            barbers: true
        }
    });

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

    const barber = await prisma.barber.findUnique({
        where: { userId: req.user.id }
    });

    if (!barber) return next(new AppError('Only barbers can update their shop', 403));

    const { name, address, openTime, closeTime, isActive } = req.body;

    // If attempting to go live, validate state
    if (isActive === true) {
        const currentShop = await prisma.shop.findUnique({
            where: { id: barber.shopId },
            include: { services: { include: { durations: true } }, barbers: true, queue: true }
        });

        if (!currentShop) return next(new AppError('Shop not found', 404));

        // Create a temporary object with prospective updates to check if it WOULD be DRAFT
        const prospectiveShop = {
            ...currentShop,
            name: name !== undefined ? name : currentShop.name,
            address: address !== undefined ? address : currentShop.address,
        };

        if (getShopStatus(prospectiveShop) === ShopStatus.DRAFT) {
            return next(new AppError('Cannot go live with an incomplete profile or no services', 400));
        }
    }

    const shop = await prisma.shop.update({
        where: { id: barber.shopId },
        data: { name, address, openTime, closeTime, isActive }
    });

    res.status(200).json({ status: 'success', data: shop });
});

