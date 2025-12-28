import { Router } from 'express';
import { getQueue, joinQueue, updateStatus } from '../controllers/queueController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Public or Protected? usually Protected.
router.use(protect);

router.get('/:shopId', getQueue);
router.post('/join', restrictTo(Role.CUSTOMER), joinQueue);
router.patch('/:itemId/status', restrictTo(Role.BARBER, Role.ADMIN), updateStatus);

export default router;
