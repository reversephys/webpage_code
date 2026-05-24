/**
 * Promotion Logic: Temporary permission boost for new registrations.
 * Period: 2026-05-10 to 2026-06-10 (1 month)
 */
export function getInitialPermissionGroup(): number {
    const PROMO_START = new Date("2026-05-10T00:00:00Z");
    const PROMO_END = new Date("2026-06-10T23:59:59Z");
    const now = new Date();

    if (now >= PROMO_START && now <= PROMO_END) {
        return 1; // Special promotion: level 1
    }

    return 0; // Default: level 0
}
