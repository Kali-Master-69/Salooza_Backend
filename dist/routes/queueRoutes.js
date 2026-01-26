"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queueController_1 = require("../controllers/queueController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Public preview endpoint (no auth required for reading preview)
router.get('/:shopId/preview', queueController_1.getQueuePreview);
router.use(authMiddleware_1.protect);
router.get('/my-queue', (0, authMiddleware_1.restrictTo)(client_1.Role.SHOP_OWNER, client_1.Role.BARBER), queueController_1.getMyQueue);
router.get('/customer-status', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.getMyCustomerQueue);
router.post('/join', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.joinQueue);
router.post('/walk-in', (0, authMiddleware_1.restrictTo)(client_1.Role.SHOP_OWNER, client_1.Role.BARBER), queueController_1.addWalkIn);
router.patch('/pause', (0, authMiddleware_1.restrictTo)(client_1.Role.SHOP_OWNER), queueController_1.toggleQueuePause);
router.delete('/:itemId/leave', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.leaveQueue);
router.get('/:shopId', queueController_1.getQueue);
router.patch('/:itemId/status', (0, authMiddleware_1.restrictTo)(client_1.Role.SHOP_OWNER, client_1.Role.ADMIN, client_1.Role.BARBER), queueController_1.updateStatus);
exports.default = router;
