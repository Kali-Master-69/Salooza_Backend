"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceController_1 = require("../controllers/serviceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.get('/:shopId', serviceController_1.getServices);
router.use(authMiddleware_1.protect);
router.post('/', (0, authMiddleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.SHOP_OWNER), serviceController_1.createService);
router.patch('/:id', (0, authMiddleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.SHOP_OWNER), serviceController_1.updateService);
router.delete('/:id', (0, authMiddleware_1.restrictTo)(client_1.Role.ADMIN, client_1.Role.SHOP_OWNER), serviceController_1.deleteService);
exports.default = router;
