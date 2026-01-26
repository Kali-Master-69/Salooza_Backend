"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teamController_1 = require("../controllers/teamController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Owner only: Generate invite
router.post('/invite', authMiddleware_1.protect, (0, authMiddleware_1.restrictTo)(client_1.Role.SHOP_OWNER), teamController_1.createInvite);
// Public: Validate invite code
router.get('/invite/:code', teamController_1.validateInvite);
// Public: Accept invite (Signup as Barber)
router.post('/invite/:code/accept', teamController_1.acceptInvite);
exports.default = router;
