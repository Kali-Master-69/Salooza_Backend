import express from 'express';
import { createService, getServices, updateService, deleteService } from '../controllers/serviceController';

import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

router.get('/:shopId', getServices);

router.use(protect);
router.post('/', restrictTo(Role.ADMIN, Role.SHOP_OWNER), createService);
router.patch('/:id', restrictTo(Role.ADMIN, Role.SHOP_OWNER), updateService);
router.delete('/:id', restrictTo(Role.ADMIN, Role.SHOP_OWNER), deleteService);


export default router;
