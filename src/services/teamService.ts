import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword, signToken } from '../utils/auth';

export const generateInvite = async (userId: string) => {
    // 1. Get Shop Owner and their Shop
    const shopOwner = await prisma.shopOwner.findUnique({
        where: { userId },
        include: { shop: true }
    });

    if (!shopOwner || !shopOwner.shop) {
        throw new AppError('Shop not found for this owner', 404);
    }

    // 2. Generate unique code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars

    // 3. Create Invite
    const invite = await prisma.invite.create({
        data: {
            code,
            shopId: shopOwner.shop.id,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        }
    });

    // Return the full join URL or just the code
    return {
        code,
        expiresAt: invite.expiresAt,
        joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/join-team/${code}`
    };
};

export const validateInvite = async (code: string) => {
    const invite = await prisma.invite.findUnique({
        where: { code },
        include: { shop: { select: { name: true, id: true } } }
    });

    if (!invite) {
        throw new AppError('Invalid invite code', 404);
    }

    if (invite.usedAt) {
        throw new AppError('This invite has already been used', 400);
    }

    if (new Date() > invite.expiresAt) {
        throw new AppError('Invite expired', 400);
    }

    return {
        isValid: true,
        shopName: invite.shop.name,
        shopId: invite.shop.id
    };
};

export const acceptBarberInvite = async (code: string, data: any) => {
    // 1. Validate Invite
    const { isValid, shopId } = await validateInvite(code);
    if (!isValid) throw new AppError('Invalid invite', 400);

    const { email, password, name, phone } = data;

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await hashPassword(password);

    // 3. Transaction: Create User + Barber + Update Invite
    const result = await prisma.$transaction(async (tx) => {
        // Create User
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.BARBER,
            }
        });

        // Create Barber Profile
        const barber = await tx.barber.create({
            data: {
                userId: user.id,
                name,
                shopId: shopId,
            }
        });

        // Mark Invite Used
        await tx.invite.update({
            where: { code },
            data: { usedAt: new Date() }
        });

        return { user, barber };
    });

    // 4. Generate Token
    const token = signToken(result.user.id, Role.BARBER);

    return { user: result.user, barber: result.barber, token };
};
