"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Customer routes
router.post('/customer/register', authController_1.registerCustomer);
router.post('/customer/login', authController_1.loginCustomer);
// Barber routes (mapped to Shop Owner for backward compatibility of routes)
router.post('/barber/register', authController_1.registerShopOwner);
router.post('/barber/login', authController_1.loginShopOwner);
// Admin routes
router.post('/admin/register', authController_1.registerAdmin);
router.post('/admin/login', authController_1.loginAdmin);
// Standard auth routes - keeping these for backward compatibility if needed, 
// but mapping them to customer as default
router.post('/signup', authController_1.registerCustomer);
router.post('/login', authController_1.loginCommon);
router.use(authMiddleware_1.protect);
router.get('/profile', authController_1.getProfile);
exports.default = router;
