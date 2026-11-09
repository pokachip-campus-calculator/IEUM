import { homeService } from "./homeService";
import { notificationService } from "./notificationService";
import { session } from "../session";

export interface BadgeCounts {
  unreadNotifications: number;
  unreadReplies: number;
}

export const BADGE_COUNTS_CHANGED = "ieum:badge-counts-changed";

export const badgeService = {
  async getCounts(): Promise<BadgeCounts> {
    const [unreadNotifications, unreadReplies] = await Promise.all([
      notificationService.getUnreadCount(),
      session.user.role === "learner" ? homeService.getHome().then((home) => home.unreadMessages) : 0,
    ]);
    return { unreadNotifications, unreadReplies };
  },

};
