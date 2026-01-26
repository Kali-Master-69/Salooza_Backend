import express from 'express';
import { updateAvailability, updateBarberAvailability } from '../controllers/availabilityController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);

// Shop-level availability (Owner only)
router.patch('/availability/status', restrictTo(Role.SHOP_OWNER), updateAvailability);

// Personal-level availability (Barber or Owner)
router.patch('/barber/availability', restrictTo(Role.BARBER, Role.SHOP_OWNER), updateBarberAvailability);

export default router;
