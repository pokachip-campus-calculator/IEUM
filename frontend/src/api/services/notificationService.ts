import { USE_MOCK, http } from "../client";
import type { AppNotification } from "../types";
import * as notifications from "../mock/notifications";

/** 알림 (학습자·이음쌤 공용) */
export const notificationService = {
  /** GET /notifications */
  async getNotifications(): Promise<Record<"learner" | "teacher", AppNotification[]>> {
    if (USE_MOCK) return notifications.notificationsByRole;
    return http("GET", "/notifications");
  },
  /** POST /notifications/read */
  async markRead(ids: string[]): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/notifications/read", { ids });
  },
};
