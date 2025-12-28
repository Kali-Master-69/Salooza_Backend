"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queueController_1 = require("../controllers/queueController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public or Protected? usually Protected.
router.use(authMiddleware_1.protect);
router.get('/:shopId', queueController_1.getQueue);
router.post('/join', (0, authMiddleware_1.restrictTo)(client_1.Role.CUSTOMER), queueController_1.joinQueue);
router.patch('/:itemId/status', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER, client_1.Role.ADMIN), queueController_1.updateStatus);
exports.default = router;
