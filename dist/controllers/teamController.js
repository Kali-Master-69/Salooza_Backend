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
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvite = exports.validateInvite = exports.createInvite = void 0;
const teamService = __importStar(require("../services/teamService"));
const AppError_1 = require("../utils/AppError");
// Quick helper if catchAsync is not exported (it was used in authController)
// Re-implementing just in case import fails or to be safe
const catchAsyncFn = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.createInvite = catchAsyncFn(async (req, res, next) => {
    // Assumes protect middleware has run and req.user exists
    if (!req.user)
        return next(new AppError_1.AppError('Not authenticated', 401));
    const result = await teamService.generateInvite(req.user.id);
    res.status(201).json({
        status: 'success',
        data: result
    });
});
exports.validateInvite = catchAsyncFn(async (req, res, next) => {
    const { code } = req.params;
    const result = await teamService.validateInvite(code);
    res.status(200).json({
        status: 'success',
        data: result
    });
});
exports.acceptInvite = catchAsyncFn(async (req, res, next) => {
    const { code } = req.params;
    const { email, password, name, phone } = req.body;
    const result = await teamService.acceptBarberInvite(code, {
        email,
        password,
        name,
        phone
    });
    res.status(201).json({
        status: 'success',
        token: result.token,
        data: {
            user: result.user,
            barber: result.barber
        }
    });
});
