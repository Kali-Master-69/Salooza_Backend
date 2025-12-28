"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['CUSTOMER', 'BARBER', 'ADMIN']), // Explicitly provided or endpoint specific
    // Specific fields
    phone: zod_1.z.string().optional(), // For Customer
    shopId: zod_1.z.string().optional(), // For Barber
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
