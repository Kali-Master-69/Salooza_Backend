import { Router } from 'express';
import { createShop, getShops } from '../controllers/shopController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getShops);

router.use(protect);
router.post('/', restrictTo(Role.ADMIN), createShop);

export default router;
