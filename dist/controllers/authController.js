"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.loginAdmin = exports.registerAdmin = exports.loginBarber = exports.registerBarber = exports.loginCustomer = exports.registerCustomer = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const authService_1 = require("../services/authService");
const authValidators_1 = require("../validators/authValidators");
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.registerCustomer = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.registerSchema.parse({ ...req.body, role: 'CUSTOMER' });
    const { user, token } = await (0, authService_1.registerUser)(data, client_1.Role.CUSTOMER);
    res.status(201).json({ status: 'success', token, data: { user } });
});
exports.loginCustomer = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginUser)(data, client_1.Role.CUSTOMER);
    res.status(200).json({ status: 'success', token, data: { user } });
});
exports.registerBarber = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.registerSchema.parse({ ...req.body, role: 'BARBER' });
    const { user, token } = await (0, authService_1.registerUser)(data, client_1.Role.BARBER);
    res.status(201).json({ status: 'success', token, data: { user } });
});
exports.loginBarber = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginUser)(data, client_1.Role.BARBER);
    res.status(200).json({ status: 'success', token, data: { user } });
});
exports.registerAdmin = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.registerSchema.parse({ ...req.body, role: 'ADMIN' });
    const { user, token } = await (0, authService_1.registerUser)(data, client_1.Role.ADMIN);
    res.status(201).json({ status: 'success', token, data: { user } });
});
exports.loginAdmin = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginUser)(data, client_1.Role.ADMIN);
    res.status(200).json({ status: 'success', token, data: { user } });
});
exports.getProfile = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not found', 404));
    }
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
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
    if (!user) {
        return next(new AppError_1.AppError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});
