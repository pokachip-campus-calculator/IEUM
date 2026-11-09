export const BADGE_COUNTS_CHANGED = "ieum:badge-counts-changed";

export function notifyBadgeCountsChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(BADGE_COUNTS_CHANGED));
}
