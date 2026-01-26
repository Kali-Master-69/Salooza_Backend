"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationById = exports.getMessages = exports.sendMessage = exports.startConversation = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const startConversation = async (customerId, shopOwnerId) => {
    return await prisma_1.default.conversation.create({
        data: {
            customerId,
            shopOwnerId,
        }
    });
};
exports.startConversation = startConversation;
const sendMessage = async (conversationId, senderId, content) => {
    return await prisma_1.default.message.create({
        data: {
            conversationId,
            senderId,
            content
        }
    });
};
exports.sendMessage = sendMessage;
const getMessages = async (conversationId) => {
    return await prisma_1.default.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
    });
};
exports.getMessages = getMessages;
const getConversationById = async (id) => {
    return await prisma_1.default.conversation.findUnique({
        where: { id },
        include: { messages: true }
    });
};
exports.getConversationById = getConversationById;
