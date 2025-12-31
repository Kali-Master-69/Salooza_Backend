"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../utils/auth");
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const registerUser = async (data, role) => {
    const { email, password, name, ...otherDetails } = data;
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError_1.AppError('Email already exists', 400);
    }
    const hashedPassword = await (0, auth_1.hashPassword)(password);
    // Transaction to create User and Profile
    const result = await prisma_1.default.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            },
        });
        if (role === client_1.Role.CUSTOMER) {
            await tx.customer.create({
                data: {
                    userId: user.id,
                    name,
                    phone: otherDetails.phone,
                },
            });
        }
        else if (role === client_1.Role.BARBER) {
            let shopId = otherDetails.shopId;
            if (!shopId) {
                // Auto-create a shop for the barber if they don't have one
                const shop = await tx.shop.create({
                    data: {
                        name: `${name}'s Barber Shop`,
                        openTime: "09:00",
                        closeTime: "21:00",
                        queue: {
                            create: {}
                        }
                    }
                });
                shopId = shop.id;
            }
            await tx.barber.create({
                data: {
                    userId: user.id,
                    name,
                    shopId: shopId,
                },
            });
        }
        else if (role === client_1.Role.ADMIN) {
            await tx.admin.create({
                data: {
                    userId: user.id,
                    name,
                },
            });
        }
        return user;
    });
    const token = (0, auth_1.signToken)(result.id, result.role);
    return { user: result, token };
};
exports.registerUser = registerUser;
const loginUser = async (data, role) => {
    const { email, password } = data;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !(await (0, auth_1.comparePassword)(password, user.password))) {
        throw new AppError_1.AppError('Incorrect email or password', 401);
    }
    // Strict Role Check
    if (user.role !== role) {
        throw new AppError_1.AppError('Access denied for this role', 403);
    }
    const token = (0, auth_1.signToken)(user.id, user.role);
    return { user, token };
};
exports.loginUser = loginUser;
