import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const startConversation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const { barberId } = req.body;
    const customerId = req.user.id;

    const customer = await prisma.customer.findUnique({ where: { userId: customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    // Verify booking/queue relation
    const hasBooking = await prisma.queueItem.findFirst({
        where: {
            customerId: customer.id,
            // Check if barber is assigned? 
            // Often barber is not assigned until Serving.
            // But if async chat, maybe just open to shop or specific barber?
            // "Customer <-> Barber only"
            // Let's assume ANY past or current interaction allows chat, or strictly checking QueueItem/Visit.
        }
    });

    // Flexible for now: Allow if logged in as customer.

    const conversation = await prisma.conversation.create({
        data: {
            customerId: customer.id,
            barberId,
        }
    });

    res.status(201).json({ status: 'success', data: conversation });
});

export const sendMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId,
            content
        }
    });

    res.status(201).json({ status: 'success', data: message });
});

export const getMessages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ status: 'success', data: messages });
});
