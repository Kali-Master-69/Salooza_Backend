"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.sendMessage = exports.startConversation = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const chatService = __importStar(require("../services/chatService"));
const customerService = __importStar(require("../services/customerService"));
const queueService = __importStar(require("../services/queueService"));
exports.startConversation = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const { barberId, shopOwnerId } = req.body;
    const targetId = shopOwnerId || barberId; // Support both for transition
    if (!targetId)
        return next(new AppError_1.AppError('Shop Owner ID (or barberId) is required', 400));
    const customerId = req.user.id;
    const customer = await customerService.getCustomerByUserId(customerId);
    if (!customer)
        throw new AppError_1.AppError('Customer not found', 404);
    // Verify booking/queue relation (using queueService)
    const activeItem = await queueService.getCustomerActiveQueueItem(customer.id);
    // Flexible for now: Allow if customer is in queue or has history.
    // For now we just use the customer check.
    const conversation = await chatService.startConversation(customer.id, targetId);
    res.status(201).json({ status: 'success', data: conversation });
});
exports.sendMessage = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const message = await chatService.sendMessage(conversationId, senderId, content);
    res.status(201).json({ status: 'success', data: message });
});
exports.getMessages = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    res.status(200).json({ status: 'success', data: messages });
});
