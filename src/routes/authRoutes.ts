import express from 'express';
import {
    registerCustomer,
    loginCustomer,
    registerShopOwner,
    loginShopOwner,
    registerAdmin,
    loginAdmin,
    loginCommon,
    getProfile
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Customer routes
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

// Barber routes (mapped to Shop Owner for backward compatibility of routes)
router.post('/barber/register', registerShopOwner);
router.post('/barber/login', loginShopOwner);

// Admin routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Standard auth routes - keeping these for backward compatibility if needed, 
// but mapping them to customer as default
router.post('/signup', registerCustomer);
router.post('/login', loginCommon);

router.use(protect);
router.get('/profile', getProfile);

export default router;
