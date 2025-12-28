"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.sendMessage = exports.startConversation = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
exports.startConversation = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const { barberId } = req.body;
    const customerId = req.user.id;
    const customer = await prisma_1.default.customer.findUnique({ where: { userId: customerId } });
    if (!customer)
        throw new AppError_1.AppError('Customer not found', 404);
    // Verify booking/queue relation
    const hasBooking = await prisma_1.default.queueItem.findFirst({
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
    const conversation = await prisma_1.default.conversation.create({
        data: {
            customerId: customer.id,
            barberId,
        }
    });
    res.status(201).json({ status: 'success', data: conversation });
});
exports.sendMessage = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const message = await prisma_1.default.message.create({
        data: {
            conversationId,
            senderId,
            content
        }
    });
    res.status(201).json({ status: 'success', data: message });
});
exports.getMessages = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { conversationId } = req.params;
    const messages = await prisma_1.default.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ status: 'success', data: messages });
});
