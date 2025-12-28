import { Router } from 'express';
import {
    registerCustomer,
    loginCustomer,
    registerBarber,
    loginBarber,
    registerAdmin,
    loginAdmin,
} from '../controllers/authController';

const router = Router();

// Customer
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

// Barber
router.post('/barber/register', registerBarber);
router.post('/barber/login', loginBarber);

// Admin
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

export default router;
