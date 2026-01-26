import { Shop, Service, Queue, ShopOwner, ServiceDuration } from '@prisma/client';
import { ShopStatus } from '../types/shop';

type ShopWithRelations = Shop & {
    services?: (Service & { durations: ServiceDuration[] })[];
    queue?: Queue | null;
    owner?: ShopOwner | null;
    barbers?: import('@prisma/client').Barber[];
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

    // 3. PAUSED check: Active but queue paused or no staff available
    const isQueuePaused = shop.queue?.isPaused;

    const ownerActive = shop.owner?.isActive ?? false;
    const ownerAvailable = (shop.owner?.isActive && shop.owner?.isAvailable) ?? false;

    const anyBarberActive = (shop.barbers || []).some(b => b.isActive);
    const anyBarberAvailable = (shop.barbers || []).some(b => b.isActive && b.isAvailable);

    const hasActiveStaff = ownerActive || anyBarberActive;
    const hasAvailableStaff = ownerAvailable || anyBarberAvailable;

    // If queue is paused, OR no one is active (shop closed completely), OR everyone is busy/away (no one available)
    // Actually, usually PAUSED implies the Queue is paused. 
    // If NO staff is active, it's definitely unserviceable.
    // If staff is active but not available (e.g. busy), the shop might still be "ACTIVE" but with high wait time?
    // However, the original logic required "hasAvailableOwner".
    // "hasAvailableOwner" usually implies "someone who can take a customer NOW or SOON".
    // If everyone is 'busy' status, maybe we shouldn't hide the shop?
    // Let's stick to the previous intent but fix the data access.
    // Previous: if (!hasAvailableOwner) -> PAUSED.

    if (isQueuePaused || !hasActiveStaff || !hasAvailableStaff) {
        return ShopStatus.PAUSED;
    }

    // 4. ACTIVE: Everything is good
    return ShopStatus.ACTIVE;
};

export const isVisibleToCustomer = (status: ShopStatus): boolean => {
    // Only ACTIVE shops are visible to customers based on requirements
    return status === ShopStatus.ACTIVE;
};
