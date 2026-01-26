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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../utils/auth");
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const customerService = __importStar(require("./customerService"));
const shopService = __importStar(require("./shopService"));
const shopOwnerService = __importStar(require("./shopOwnerService"));
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
            await customerService.createCustomer({
                userId: user.id,
                name,
                phone: otherDetails.phone,
            }, tx);
        }
        else if (role === client_1.Role.SHOP_OWNER) {
            // Strict Shop Owner Flow: ALWAYS create new Shop
            const shop = await shopService.createShop({
                name: `${name}'s Barber Shop`,
                openTime: "09:00",
                closeTime: "21:00",
            }, tx);
            // Create Owner, link strictly to this shop
            await shopOwnerService.createShopOwner({
                userId: user.id,
                name,
                shopId: shop.id, // Relations will need to be fixed in shopOwnerService if it uses old schema
            }, tx);
            // Update Shop to set ownerId (circular dependency fix or standard relation)
            // Since we added ownerId to Shop as unique 1:1, we must set it.
            // But ShopOwner also has shopId. 
            // In Prisma, usually you create one side. Ideally we create ShopOwner nested in Shop or vice versa.
            // Current `createShop` might not support `ownerId`.
            // Let's manually link them here to be safe.
            await tx.shop.update({
                where: { id: shop.id },
                data: { ownerId: (await tx.shopOwner.findUniqueOrThrow({ where: { userId: user.id } })).id }
            });
        }
        else if (role === client_1.Role.BARBER) {
            throw new AppError_1.AppError('Barbers cannot sign up directly. Please use your invite link.', 403);
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
    // Strict Role Check (only if role is specified)
    if (role && user.role !== role) {
        throw new AppError_1.AppError('Access denied for this role', 403);
    }
    const token = (0, auth_1.signToken)(user.id, user.role);
    return { user, token };
};
exports.loginUser = loginUser;
const getUserProfile = async (userId) => {
    return await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            customer: true,
            shopOwner: {
                include: {
                    shop: {
                        include: {
                            services: {
                                include: {
                                    durations: true
                                }
                            }
                        }
                    }
                }
            },
            admin: true,
        },
    });
};
exports.getUserProfile = getUserProfile;
