import { Router } from 'express';
import { updateAvailability } from '../controllers/availabilityController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.patch('/status', restrictTo(Role.BARBER), updateAvailability);

export default router;
