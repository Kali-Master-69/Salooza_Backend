"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = exports.registerAdmin = exports.loginBarber = exports.registerBarber = exports.loginCustomer = exports.registerCustomer = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const authService_1 = require("../services/authService");
const authValidators_1 = require("../validators/authValidators");
const client_1 = require("@prisma/client");
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
