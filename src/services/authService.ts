import prisma from '../utils/prisma';
import { hashPassword, signToken, comparePassword } from '../utils/auth';
import { AppError } from '../utils/AppError';
import { Role, Prisma } from '@prisma/client';

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
            await tx.customer.create({
                data: {
                    userId: user.id,
                    name,
                    phone: otherDetails.phone,
                },
            });
        } else if (role === Role.BARBER) {
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
