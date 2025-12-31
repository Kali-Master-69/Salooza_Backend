"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const availabilityController_1 = require("../controllers/availabilityController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.patch('/status', (0, authMiddleware_1.restrictTo)(client_1.Role.BARBER), availabilityController_1.updateAvailability);
exports.default = router;
