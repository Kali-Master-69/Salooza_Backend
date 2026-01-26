import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as chatService from '../services/chatService';
import * as customerService from '../services/customerService';
import * as queueService from '../services/queueService';

export const startConversation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const { barberId, shopOwnerId } = req.body;
    const targetId = shopOwnerId || barberId; // Support both for transition

    if (!targetId) return next(new AppError('Shop Owner ID (or barberId) is required', 400));

    const customerId = req.user.id;

    const customer = await customerService.getCustomerByUserId(customerId);
    if (!customer) throw new AppError('Customer not found', 404);

    // Verify booking/queue relation (using queueService)
    const activeItem = await queueService.getCustomerActiveQueueItem(customer.id);

    // Flexible for now: Allow if customer is in queue or has history.
    // For now we just use the customer check.

    const conversation = await chatService.startConversation(customer.id, targetId);

    res.status(201).json({ status: 'success', data: conversation });
});

export const sendMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('User not authenticated', 401));
    }

    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    const message = await chatService.sendMessage(conversationId, senderId, content);

    res.status(201).json({ status: 'success', data: message });
});

export const getMessages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const messages = await chatService.getMessages(conversationId);

    res.status(200).json({ status: 'success', data: messages });
});
