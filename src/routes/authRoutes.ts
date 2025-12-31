import express from 'express';
import {
    registerCustomer,
    loginCustomer,
    registerBarber,
    loginBarber,
    registerAdmin,
    loginAdmin,
    getProfile
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Customer routes
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

// Barber routes
router.post('/barber/register', registerBarber);
router.post('/barber/login', loginBarber);

// Admin routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Standard auth routes - keeping these for backward compatibility if needed, 
// but mapping them to customer as default
router.post('/signup', registerCustomer);
router.post('/login', loginCustomer);

router.use(protect);
router.get('/profile', getProfile);

export default router;
