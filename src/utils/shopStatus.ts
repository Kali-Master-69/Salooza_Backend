import { Shop, Service, Queue, Barber, ServiceDuration } from '@prisma/client';
import { ShopStatus } from '../types/shop';

type ShopWithRelations = Shop & {
    services?: (Service & { durations: ServiceDuration[] })[];
    queue?: Queue | null;
    barbers?: Barber[];
};

export const getShopStatus = (shop: ShopWithRelations): ShopStatus => {
    // 1. DRAFT check: Missing profile info or no services
    const hasName = !!shop.name && shop.name.trim() !== '';
    const hasAddress = !!shop.address && shop.address.trim() !== '';

    // Check if there is at least one service with at least one duration
    const hasValidServices = (shop.services || []).some(s =>
        s.durations && s.durations.length > 0
    );

    if (!hasName || !hasAddress || !hasValidServices) {
        return ShopStatus.DRAFT;
    }

    // 2. READY check: Profile complete but not explicitly active/live
    if (!shop.isActive) {
        return ShopStatus.READY;
    }

    // 3. PAUSED check: Active but queue paused or no barber available
    const isQueuePaused = shop.queue?.isPaused;
    const hasActiveBarber = (shop.barbers || []).some(b => b.isActive);
    const hasAvailableBarber = (shop.barbers || []).some(b => b.isActive && b.isAvailable);

    if (isQueuePaused || !hasActiveBarber || !hasAvailableBarber) {
        return ShopStatus.PAUSED;
    }

    // 4. ACTIVE: Everything is good
    return ShopStatus.ACTIVE;
};

export const isVisibleToCustomer = (status: ShopStatus): boolean => {
    // Only ACTIVE shops are visible to customers based on requirements
    return status === ShopStatus.ACTIVE;
};
