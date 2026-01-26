import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const getBarberByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.findUnique({
        where: { userId }
    });
};

export const updateBarberAvailability = async (barberId: string, isAvailable: boolean, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.barber.update({
        where: { id: barberId },
        data: { isAvailable }
    });
};
