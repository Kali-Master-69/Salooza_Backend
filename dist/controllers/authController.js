"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.loginCommon = exports.loginAdmin = exports.registerAdmin = exports.loginShopOwner = exports.registerShopOwner = exports.loginCustomer = exports.registerCustomer = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const authService_1 = require("../services/authService");
const authValidators_1 = require("../validators/authValidators");
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
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
exports.registerShopOwner = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.registerSchema.parse({ ...req.body, role: 'SHOP_OWNER' });
    const { user, token } = await (0, authService_1.registerUser)(data, client_1.Role.SHOP_OWNER);
    res.status(201).json({ status: 'success', token, data: { user } });
});
exports.loginShopOwner = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    const { user, token } = await (0, authService_1.loginUser)(data, client_1.Role.SHOP_OWNER);
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
exports.loginCommon = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    // Don't pass role, allowing auto-detection
    const { user, token } = await (0, authService_1.loginUser)(data);
    res.status(200).json({ status: 'success', token, data: { user } });
});
exports.getProfile = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not found', 404));
    }
    const user = await (0, authService_1.getUserProfile)(req.user.id);
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
