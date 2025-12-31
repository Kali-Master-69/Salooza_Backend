import express from 'express';
import { getQueue, getMyQueue, joinQueue, updateStatus, toggleQueuePause, addWalkIn, getMyCustomerQueue } from '../controllers/queueController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.use(protect);

router.get('/my-queue', restrictTo(Role.BARBER), getMyQueue);
router.get('/customer-status', restrictTo(Role.CUSTOMER), getMyCustomerQueue);
router.post('/join', restrictTo(Role.CUSTOMER), joinQueue);
router.post('/walk-in', restrictTo(Role.BARBER), addWalkIn);
router.patch('/pause', restrictTo(Role.BARBER), toggleQueuePause);
router.get('/:shopId', getQueue);
router.patch('/:itemId/status', restrictTo(Role.BARBER, Role.ADMIN), updateStatus);

export default router;
