export enum ShopStatus {
    DRAFT = 'DRAFT',     // Incomplete profile or no services
    READY = 'READY',     // Complete but barber hasn't gone live (isActive=false)
    ACTIVE = 'ACTIVE',   // Live, open, and accepting customers
    PAUSED = 'PAUSED',   // Live but queue paused or barber unavailable
    HIDDEN = 'HIDDEN'    // Explicitly hidden or system-downgraded
}
