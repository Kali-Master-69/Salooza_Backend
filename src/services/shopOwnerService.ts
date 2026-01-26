import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';


export const getShopOwnerByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shopOwner.findUnique({
        where: { userId }
    });
};

export const getShopOwnerById = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shopOwner.findUnique({
        where: { id }
    });
};

export const updateShopOwnerAvailability = async (shopOwnerId: string, isAvailable: boolean, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shopOwner.update({
        where: { id: shopOwnerId },
        data: { isAvailable }
    });
};

export const getShopOwnersByShopId = async (shopId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.shopOwner.findMany({
        where: { shop: { id: shopId } }
    });
};

export const createShopOwner = async (data: any, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    // Extract shopId if it exists, as ShopOwner model doesn't have it (Shop has ownerId)
    // We ignore shopId here because the linking is done in authService by updating the Shop
    const { shopId, ...ownerData } = data;
    return await client.shopOwner.create({
        data: ownerData
    });
};
