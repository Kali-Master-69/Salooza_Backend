import express from 'express';
import { getQueue, getMyQueue, joinQueue, updateStatus, toggleQueuePause, addWalkIn, getMyCustomerQueue, leaveQueue, getQueuePreview } from '../controllers/queueController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Public preview endpoint (no auth required for reading preview)
router.get('/:shopId/preview', getQueuePreview);

router.use(protect);

router.get('/my-queue', restrictTo(Role.SHOP_OWNER, Role.BARBER), getMyQueue);
router.get('/customer-status', restrictTo(Role.CUSTOMER), getMyCustomerQueue);
router.post('/join', restrictTo(Role.CUSTOMER), joinQueue);
router.post('/walk-in', restrictTo(Role.SHOP_OWNER, Role.BARBER), addWalkIn);
router.patch('/pause', restrictTo(Role.SHOP_OWNER), toggleQueuePause);
router.delete('/:itemId/leave', restrictTo(Role.CUSTOMER), leaveQueue);
router.get('/:shopId', getQueue);
router.patch('/:itemId/status', restrictTo(Role.SHOP_OWNER, Role.ADMIN, Role.BARBER), updateStatus);

export default router;
