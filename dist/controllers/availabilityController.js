"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailability = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.updateAvailability = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    // Only Barber can update their own availability
    const barber = await prisma_1.default.barber.findUnique({ where: { userId: req.user.id } });
    if (!barber) {
        // Or if admin updates for barber
        // For now, assume barber updates own
        return res.status(404).json({ message: 'Barber profile not found' });
    }
    const { isAvailable } = req.body;
    const updated = await prisma_1.default.barber.update({
        where: { id: barber.id },
        data: { isAvailable }
    });
    res.status(200).json({ status: 'success', data: updated });
});
