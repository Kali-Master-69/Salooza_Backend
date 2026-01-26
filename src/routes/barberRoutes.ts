import express from 'express';
import { updateBarberAvailability } from '../controllers/availabilityController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);
router.patch('/availability', restrictTo(Role.BARBER, Role.SHOP_OWNER), updateBarberAvailability);

export default router;
