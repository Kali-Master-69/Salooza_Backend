import { Router } from 'express';
import { createService, getServices } from '../controllers/serviceController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/:shopId', getServices);

router.use(protect);
router.post('/', restrictTo(Role.ADMIN, Role.BARBER), createService);

export default router;
