import prisma from '../utils/prisma';
import { hashPassword, signToken, comparePassword } from '../utils/auth';
import { AppError } from '../utils/AppError';
import { Role, Prisma } from '@prisma/client';
import * as customerService from './customerService';
import * as shopService from './shopService';
import * as barberService from './barberService';

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
        } else if (role === Role.BARBER) {
            let shopId = otherDetails.shopId;

            if (!shopId) {
                // Auto-create a shop for the barber
                const shop = await shopService.createShop({
                    name: `${name}'s Barber Shop`,
                    openTime: "09:00",
                    closeTime: "21:00",
                }, tx);
                shopId = shop.id;
            }

            await barberService.createBarber({
                userId: user.id,
                name,
                shopId: shopId,
            }, tx);
        } else if (role === Role.ADMIN) {
            // Assume we might have adminService in future
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

export const loginUser = async (data: any, role: Role) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    // Strict Role Check
    if (user.role !== role) {
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
            barber: {
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

