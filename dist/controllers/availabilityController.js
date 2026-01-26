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
exports.updateBarberAvailability = exports.updateAvailability = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const shopOwnerService = __importStar(require("../services/shopOwnerService"));
const barberService = __importStar(require("../services/barberService"));
const shopService = __importStar(require("../services/shopService"));
const client_1 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
exports.updateAvailability = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    // Only Shop Owner can update the SHOP availability
    const shop = await shopService.getShopByUserId(req.user.id);
    if (!shop) {
        return next(new AppError_1.AppError('Shop not found for this owner', 404));
    }
    const { isAvailable } = req.body; // isAvailable here corresponds to shop's active status
    const updated = await shopService.updateShop(shop.id, { isActive: isAvailable });
    res.status(200).json({ status: 'success', data: updated });
});
exports.updateBarberAvailability = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError('User not authenticated', 401));
    }
    const { isAvailable } = req.body;
    let updated;
    if (req.user.role === client_1.Role.BARBER) {
        const barber = await barberService.getBarberByUserId(req.user.id);
        if (!barber)
            return next(new AppError_1.AppError('Barber profile not found', 404));
        updated = await barberService.updateBarberAvailability(barber.id, isAvailable);
    }
    else if (req.user.role === client_1.Role.SHOP_OWNER) {
        const shopOwner = await shopOwnerService.getShopOwnerByUserId(req.user.id);
        if (!shopOwner)
            return next(new AppError_1.AppError('Shop Owner profile not found', 404));
        updated = await shopOwnerService.updateShopOwnerAvailability(shopOwner.id, isAvailable);
    }
    else {
        return next(new AppError_1.AppError('Unauthorized', 403));
    }
    res.status(200).json({ status: 'success', data: updated });
});
