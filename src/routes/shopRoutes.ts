import express from 'express';
import { createShop, getShops, getMyShop, updateShop, getShop } from '../controllers/shopController';


import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.get('/', getShops);
router.get('/my-shop', protect, restrictTo(Role.SHOP_OWNER, Role.BARBER), getMyShop);
router.get('/:id', getShop);

router.use(protect);
router.patch('/my-shop', restrictTo(Role.SHOP_OWNER), updateShop);
router.post('/', restrictTo(Role.ADMIN), createShop);

export default router;
