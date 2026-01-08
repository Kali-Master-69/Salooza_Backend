import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const startConversation = async (customerId: string, barberId: string) => {
    return await prisma.conversation.create({
        data: {
            customerId,
            barberId,
        }
    });
};

export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
    return await prisma.message.create({
        data: {
            conversationId,
            senderId,
            content
        }
    });
};

export const getMessages = async (conversationId: string) => {
    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
    });
};

export const getConversationById = async (id: string) => {
    return await prisma.conversation.findUnique({
        where: { id },
        include: { messages: true }
    });
};
