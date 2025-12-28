"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const AppError_1 = require("../utils/AppError");
const auth_1 = require("../utils/auth");
const prisma_1 = __importDefault(require("../utils/prisma")); // Optional: if we want to check if user still exists
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError_1.AppError('You are not logged in! Please log in to get access.', 401));
    }
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        // Check if user still exists
        const currentUser = await prisma_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!currentUser) {
            return next(new AppError_1.AppError('The user belonging to this token no longer does exist.', 401));
        }
        req.user = {
            id: currentUser.id,
            role: currentUser.role,
        };
        next();
    }
    catch (error) {
        return next(new AppError_1.AppError('Invalid token. Please log in again!', 401));
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
