import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { getShopStatus } from '../utils/shopStatus';
import { ShopStatus } from '../types/shop';
import { Shop, Service, ServiceDuration, Queue, Barber } from '@prisma/client';

export type ShopWithDetails = Shop & {
    queue?: Queue | null;
    services?: (Service & { durations: ServiceDuration[] })[];
    barbers?: Barber[];
};

import { Prisma } from '@prisma/client';

export const createShop = async (data: { name: string; address?: string; openTime: string; closeTime: string }, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shop.create({
        data: {
            ...data,
            queue: {
                create: {} // Create empty queue for the shop
            }
        },
        include: { queue: true }
    });
};

export const getShops = async (tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shop.findMany({
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
};

export const getShopById = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shop.findUnique({
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
};

export const updateShop = async (shopId: string, data: any, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    const { isActive, name, address, openTime, closeTime } = data;

    // If attempting to go live, validate state
    if (isActive === true) {
        const currentShop = await getShopById(shopId, tx);
        if (!currentShop) throw new AppError('Shop not found', 404);

        const prospectiveShop = {
            ...currentShop,
            name: name !== undefined ? name : currentShop.name,
            address: address !== undefined ? address : currentShop.address,
        };

        if (getShopStatus(prospectiveShop) === ShopStatus.DRAFT) {
            throw new AppError('Cannot go live with an incomplete profile or no services', 400);
        }
    }

    return await client.shop.update({
        where: { id: shopId },
        data: { name, address, openTime, closeTime, isActive }
    });
};


export const getShopByUserId = async (userId: string) => {
    const barber = await prisma.barber.findUnique({
        where: { userId },
        include: {
            shop: {
                include: {
                    queue: true,
                    services: {
                        include: {
                            durations: true
                        }
                    },
                    barbers: true
                }
            }
        }
    });

    if (!barber) return null;
    return barber.shop;
};

export const getServiceDurations = async (ids: string[]) => {
    return await prisma.serviceDuration.findMany({
        where: { id: { in: ids } }
    });
};

export const createService = async (data: any) => {
    const { shopId, name, description, durations } = data;
    return await prisma.service.create({
        data: {
            shopId,
            name,
            description,
            durations: {
                create: durations
            }
        },
        include: { durations: true }
    });
};

export const updateService = async (id: string, data: any) => {
    const { name, description, durations } = data;
    return await prisma.service.update({
        where: { id },
        data: {
            name,
            description,
            durations: durations ? {
                deleteMany: {},
                create: durations
            } : undefined
        },
        include: { durations: true }
    });
};

export const deleteService = async (id: string) => {
    return await prisma.service.delete({ where: { id } });
};

export const getServiceById = async (id: string) => {
    return await prisma.service.findUnique({ where: { id } });
};

export const getServicesByShopId = async (shopId: string) => {
    return await prisma.service.findMany({
        where: { shopId },
        include: { durations: true }
    });
};

