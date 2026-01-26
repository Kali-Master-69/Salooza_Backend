import prisma from '../utils/prisma';
import { hashPassword, signToken, comparePassword } from '../utils/auth';
import { AppError } from '../utils/AppError';
import { Role, Prisma } from '@prisma/client';
import * as customerService from './customerService';
import * as shopService from './shopService';
import * as shopOwnerService from './shopOwnerService';

export const registerUser = async (data: any, role: Role) => {
    const { email, password, name, ...otherDetails } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    // Transaction to create User and Profile
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            },
        });

        if (role === Role.CUSTOMER) {
            await customerService.createCustomer({
                userId: user.id,
                name,
                phone: otherDetails.phone,
            }, tx);
        } else if (role === Role.SHOP_OWNER) {
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

        } else if (role === Role.BARBER) {
            throw new AppError('Barbers cannot sign up directly. Please use your invite link.', 403);
        } else if (role === Role.ADMIN) {
            await tx.admin.create({
                data: {
                    userId: user.id,
                    name,
                },
            });
        }


        return user;
    });

    const token = signToken(result.id, result.role);
    return { user: result, token };
};

export const loginUser = async (data: any, role?: Role) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    // Strict Role Check (only if role is specified)
    if (role && user.role !== role) {
        throw new AppError('Access denied for this role', 403);
    }

    const token = signToken(user.id, user.role);
    return { user, token };
};

export const getUserProfile = async (userId: string) => {
    return await prisma.user.findUnique({
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
