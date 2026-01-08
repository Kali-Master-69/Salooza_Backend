import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';


export const getBarberByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.findUnique({
        where: { userId }
    });
};

export const getBarberById = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.findUnique({
        where: { id }
    });
};

export const updateBarberAvailability = async (barberId: string, isAvailable: boolean, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.update({
        where: { id: barberId },
        data: { isAvailable }
    });
};

export const getBarbersByShopId = async (shopId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.findMany({
        where: { shopId }
    });
};

export const createBarber = async (data: any, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.create({
        data
    });
};

