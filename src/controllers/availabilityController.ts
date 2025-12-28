import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';

export const updateAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only Barber can update their own availability
    const barber = await prisma.barber.findUnique({ where: { userId: req.user.id } });
    if (!barber) {
        // Or if admin updates for barber
        // For now, assume barber updates own
        return res.status(404).json({ message: 'Barber profile not found' });
    }

    const { isAvailable } = req.body;

    const updated = await prisma.barber.update({
        where: { id: barber.id },
        data: { isAvailable }
    });

    res.status(200).json({ status: 'success', data: updated });
});
