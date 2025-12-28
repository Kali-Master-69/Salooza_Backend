import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['CUSTOMER', 'BARBER', 'ADMIN']), // Explicitly provided or endpoint specific
    // Specific fields
    phone: z.string().optional(), // For Customer
    shopId: z.string().optional(), // For Barber
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
