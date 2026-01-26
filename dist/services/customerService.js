"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = exports.logVisit = exports.getCustomerWithQueueItem = exports.getCustomerById = exports.getCustomerByUserId = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getCustomerByUserId = async (userId, tx) => {
    const client = tx || prisma_1.default;
    return await client.customer.findUnique({
        where: { userId }
    });
};
exports.getCustomerByUserId = getCustomerByUserId;
const getCustomerById = async (id, tx) => {
    const client = tx || prisma_1.default;
    return await client.customer.findUnique({
        where: { id }
    });
};
exports.getCustomerById = getCustomerById;
const getCustomerWithQueueItem = async (customerId, tx) => {
    const client = tx || prisma_1.default;
    return await client.customer.findUnique({
        where: { id: customerId },
        include: {
            queueItems: {
                where: {
                    status: { in: ['WAITING', 'SERVING'] }
                },
                include: {
                    services: { include: { service: true } },
                    queue: { include: { shop: true } }
                }
            }
        }
    });
};
exports.getCustomerWithQueueItem = getCustomerWithQueueItem;
const logVisit = async (data, tx) => {
    const client = tx || prisma_1.default;
    return await client.customerVisit.create({
        data
    });
};
exports.logVisit = logVisit;
const createCustomer = async (data, tx) => {
    const client = tx || prisma_1.default;
    return await client.customer.create({
        data
    });
};
exports.createCustomer = createCustomer;
