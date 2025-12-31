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
router.use(authMiddleware_1.protect);
router.get('/my-queue', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), queueController_1.getMyQueue);
router.get('/customer-status', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.getMyCustomerQueue);
router.post('/join', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.joinQueue);
router.post('/walk-in', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), queueController_1.addWalkIn);
router.patch('/pause', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), queueController_1.toggleQueuePause);
router.get('/:shopId', queueController_1.getQueue);
router.patch('/:itemId/status', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER, client_1.Role.ADMIN), queueController_1.updateStatus);
exports.default = router;
