"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShopOwner = exports.getShopOwnersByShopId = exports.updateShopOwnerAvailability = exports.getShopOwnerById = exports.getShopOwnerByUserId = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getShopOwnerByUserId = async (userId, tx) => {
    const client = tx || prisma_1.default;
    return await client.shopOwner.findUnique({
        where: { userId }
    });
};
exports.getShopOwnerByUserId = getShopOwnerByUserId;
const getShopOwnerById = async (id, tx) => {
    const client = tx || prisma_1.default;
    return await client.shopOwner.findUnique({
        where: { id }
    });
};
exports.getShopOwnerById = getShopOwnerById;
const updateShopOwnerAvailability = async (shopOwnerId, isAvailable, tx) => {
    const client = tx || prisma_1.default;
    return await client.shopOwner.update({
        where: { id: shopOwnerId },
        data: { isAvailable }
    });
};
exports.updateShopOwnerAvailability = updateShopOwnerAvailability;
const getShopOwnersByShopId = async (shopId, tx) => {
    const client = tx || prisma_1.default;
    return await client.shopOwner.findMany({
        where: { shop: { id: shopId } }
    });
};
exports.getShopOwnersByShopId = getShopOwnersByShopId;
const createShopOwner = async (data, tx) => {
    const client = tx || prisma_1.default;
    // Extract shopId if it exists, as ShopOwner model doesn't have it (Shop has ownerId)
    // We ignore shopId here because the linking is done in authService by updating the Shop
    const { shopId, ...ownerData } = data;
    return await client.shopOwner.create({
        data: ownerData
    });
};
exports.createShopOwner = createShopOwner;
