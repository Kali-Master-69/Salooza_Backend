"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBarberAvailability = exports.getBarberByUserId = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getBarberByUserId = async (userId, tx) => {
    const client = tx || prisma_1.default;
    return await client.barber.findUnique({
        where: { userId }
    });
};
exports.getBarberByUserId = getBarberByUserId;
const updateBarberAvailability = async (barberId, isAvailable, tx) => {
    const client = tx || prisma_1.default;
    return await client.barber.update({
        where: { id: barberId },
        data: { isAvailable }
    });
};
exports.updateBarberAvailability = updateBarberAvailability;
