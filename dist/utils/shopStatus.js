"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVisibleToCustomer = exports.getShopStatus = void 0;
const shop_1 = require("../types/shop");
const getShopStatus = (shop) => {
    // 1. DRAFT check: Missing profile info or no services
    const hasName = !!shop.name && shop.name.trim() !== '';
    const hasAddress = !!shop.address && shop.address.trim() !== '';
    // Check if there is at least one service with at least one duration
    const hasValidServices = (shop.services || []).some(s => s.durations && s.durations.length > 0);
    if (!hasName || !hasAddress || !hasValidServices) {
        return shop_1.ShopStatus.DRAFT;
    }
    // 2. READY check: Profile complete but not explicitly active/live
    if (!shop.isActive) {
        return shop_1.ShopStatus.READY;
    }
    // 3. PAUSED check: Active but queue paused or no barber available
    const isQueuePaused = shop.queue?.isPaused;
    const hasActiveBarber = (shop.barbers || []).some(b => b.isActive);
    const hasAvailableBarber = (shop.barbers || []).some(b => b.isActive && b.isAvailable);
    if (isQueuePaused || !hasActiveBarber || !hasAvailableBarber) {
        return shop_1.ShopStatus.PAUSED;
    }
    // 4. ACTIVE: Everything is good
    return shop_1.ShopStatus.ACTIVE;
};
exports.getShopStatus = getShopStatus;
const isVisibleToCustomer = (status) => {
    // Only ACTIVE shops are visible to customers based on requirements
    return status === shop_1.ShopStatus.ACTIVE;
};
exports.isVisibleToCustomer = isVisibleToCustomer;
