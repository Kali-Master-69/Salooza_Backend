import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const getCustomerByUserId = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.customer.findUnique({
        where: { userId }
    });
};

export const getCustomerById = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.customer.findUnique({
        where: { id }
    });
};

export const getCustomerWithQueueItem = async (customerId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.customer.findUnique({
        where: { id: customerId },
        include: {
            queueItems: {
                where: {
                    status: { in: ['WAITING', 'SERVING'] as any }
                },
                include: {
                    services: { include: { service: true } },
                    queue: { include: { shop: true } }
                }
            }
        }
    });
};

export const logVisit = async (data: any, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.customerVisit.create({
        data
    });
};

export const createCustomer = async (data: any, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.customer.create({
        data
    });
};



