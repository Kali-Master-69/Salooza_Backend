"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Customer
router.post('/customer/register', authController_1.registerCustomer);
router.post('/customer/login', authController_1.loginCustomer);
// Barber
router.post('/barber/register', authController_1.registerBarber);
router.post('/barber/login', authController_1.loginBarber);
// Admin
router.post('/admin/register', authController_1.registerAdmin);
router.post('/admin/login', authController_1.loginAdmin);
exports.default = router;
