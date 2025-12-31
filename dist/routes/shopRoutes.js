"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shopController_1 = require("../controllers/shopController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.get('/', shopController_1.getShops);
router.get('/my-shop', authMiddleware_1.protect, (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), shopController_1.getMyShop);
router.get('/:id', shopController_1.getShop);
router.use(authMiddleware_1.protect);
router.patch('/my-shop', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), shopController_1.updateShop);
router.post('/', (0, authMiddleware_1.restrictTo)(client_1.Role.ADMIN), shopController_1.createShop);
exports.default = router;
