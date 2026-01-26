"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptBarberInvite = exports.validateInvite = exports.generateInvite = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../utils/auth");
const generateInvite = async (userId) => {
    // 1. Get Shop Owner and their Shop
    const shopOwner = await prisma_1.default.shopOwner.findUnique({
        where: { userId },
        include: { shop: true }
    });
    if (!shopOwner || !shopOwner.shop) {
        throw new AppError_1.AppError('Shop not found for this owner', 404);
    }
    // 2. Generate unique code
    const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
    // 3. Create Invite
    const invite = await prisma_1.default.invite.create({
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
exports.generateInvite = generateInvite;
const validateInvite = async (code) => {
    const invite = await prisma_1.default.invite.findUnique({
        where: { code },
        include: { shop: { select: { name: true, id: true } } }
    });
    if (!invite) {
        throw new AppError_1.AppError('Invalid invite code', 404);
    }
    if (invite.usedAt) {
        throw new AppError_1.AppError('This invite has already been used', 400);
    }
    if (new Date() > invite.expiresAt) {
        throw new AppError_1.AppError('Invite expired', 400);
    }
    return {
        isValid: true,
        shopName: invite.shop.name,
        shopId: invite.shop.id
    };
};
exports.validateInvite = validateInvite;
const acceptBarberInvite = async (code, data) => {
    // 1. Validate Invite
    const { isValid, shopId } = await (0, exports.validateInvite)(code);
    if (!isValid)
        throw new AppError_1.AppError('Invalid invite', 400);
    const { email, password, name, phone } = data;
    // 2. Check if user exists
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError_1.AppError('Email already registered', 400);
    }
    const hashedPassword = await (0, auth_1.hashPassword)(password);
    // 3. Transaction: Create User + Barber + Update Invite
    const result = await prisma_1.default.$transaction(async (tx) => {
        // Create User
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role: client_1.Role.BARBER,
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
    const token = (0, auth_1.signToken)(result.user.id, client_1.Role.BARBER);
    return { user: result.user, barber: result.barber, token };
};
exports.acceptBarberInvite = acceptBarberInvite;
