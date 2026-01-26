import express from 'express';
import { createInvite, validateInvite, acceptInvite } from '../controllers/teamController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Owner only: Generate invite
router.post('/invite', protect, restrictTo(Role.SHOP_OWNER), createInvite);

// Public: Validate invite code
router.get('/invite/:code', validateInvite);

// Public: Accept invite (Signup as Barber)
router.post('/invite/:code/accept', acceptInvite);

export default router;
