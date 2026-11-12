import { USE_MOCK, http } from "../client";
import type { AppNotification } from "../types";
import { session } from "../session";
import { ROUTES } from "@/routes";
import * as notifications from "../mock/notifications";
import { notifyBadgeCountsChanged } from "./badgeEvents";

interface ApiNotification {
  id: number;
  type: "REPLY_ARRIVED" | "NOTE_READ" | "TEACHER_ASSIGNED" | "NOTE_RECEIVED" | "SIGNAL_FLAGGED" | "LEARNER_ASSIGNED" | "TRANSFER_REQUESTED" | "TRANSFER_ACCEPTED";
  title: string;
  body: string;
  linkType: "THREAD" | "PROFILE" | "SIGNAL" | "STUDENT" | "TRANSFER" | null;
  linkId: number | null;
  isRead: boolean;
  createdAt: string;
  /** linkType이 TRANSFER일 때만 값이 있어요(나머지는 null) */
  transferStatus?: "PENDING" | "ACCEPTED" | "EXPIRED" | null;
}

interface ApiNotificationsResponse {
  items: ApiNotification[];
  unreadCount?: number;
}

type ApiNotificationsPayload = ApiNotificationsResponse | ApiNotification[];

/** 알림이 가리키는 쪽지·학습자를 화면이 처음부터 선택하도록 ?키=id 를 붙입니다. */
function withId(path: string, key: string, id: number | null): string {
  return id === null ? path : `${path}?${key}=${id}`;
}

function mapNotification(notification: ApiNotification): AppNotification {
  const date = notification.createdAt.slice(0, 10);
  const [, month, day] = date.split("-");
  const [, rawTime] = notification.createdAt.split("T");
  const [hour, minute] = rawTime.split(":");
  const type: AppNotification["type"] =
    notification.type === "REPLY_ARRIVED"
      ? "reply"
      : notification.type === "NOTE_READ" ||
      notification.type === "NOTE_RECEIVED" ||
      notification.type === "TRANSFER_REQUESTED"
        ? "msg"
        : notification.type === "SIGNAL_FLAGGED"
          ? "signal"
          : "done";
  const href =
    notification.linkType === "PROFILE"
      ? ROUTES.profile
      : notification.linkType === "SIGNAL"
        ? ROUTES.teacherSignal
        : notification.linkType === "TRANSFER"
          ? ROUTES.notifications
          : notification.linkType === "STUDENT"
          ? withId(ROUTES.teacher, "student", notification.linkId)
          : withId(
              session.user.role === "teacher" ? ROUTES.teacherMessages : ROUTES.messages,
              "thread",
              notification.linkType === "THREAD" ? notification.linkId : null,
            );

  return {
    id: String(notification.id),
    type,
    group: `${Number(month)}월 ${Number(day)}일`,
    when: `${Number(month)}월 ${Number(day)}일 ${hour}:${minute}`,
    title: notification.title,
    body: notification.body,
    href,
    unread: !notification.isRead,
    transferId:
      notification.type === "TRANSFER_REQUESTED" && notification.linkId !== null
        ? notification.linkId
        : undefined,
    transferStatus: notification.transferStatus ?? undefined,
  };
}

/** 알림 (학습자·이음쌤 공용) */
export const notificationService = {
  /** GET /notifications — 안 읽은 알림 수 */
  async getUnreadCount(): Promise<number> {
    if (USE_MOCK) {
      return notifications.notificationsByRole[session.user.role].filter((item) => item.unread).length;
    }
    const response = await http<ApiNotificationsPayload>("GET", "/notifications");
    if (Array.isArray(response)) return response.filter((item) => !item.isRead).length;
    if (typeof response.unreadCount === "number") return response.unreadCount;
    if (!Array.isArray(response.items)) throw new Error("알림 응답 형식이 올바르지 않습니다.");
    return response.items.filter((item) => !item.isRead).length;
  },
  /** GET /notifications */
  async getNotifications(): Promise<Record<"learner" | "teacher", AppNotification[]>> {
    if (USE_MOCK) return notifications.notificationsByRole;
    const response = await http<ApiNotificationsPayload>("GET", "/notifications");
    const notificationsList = Array.isArray(response) ? response : response.items;
    if (!Array.isArray(notificationsList)) {
      throw new Error("알림 응답 형식이 올바르지 않습니다.");
    }
    const items = notificationsList.map(mapNotification);
    return {
      learner: session.user.role === "learner" ? items : [],
      teacher: session.user.role === "teacher" ? items : [],
    };
  },
  /** PATCH /notifications/{id}/read or PATCH /notifications/read-all */
  async markRead(ids: string[]): Promise<void> {
    if (USE_MOCK) return;
    if (ids.length > 1) {
      await http("PATCH", "/notifications/read-all");
      notifyBadgeCountsChanged();
      return;
    }
    if (ids.length === 1) {
      await http("PATCH", `/notifications/${encodeURIComponent(ids[0])}/read`);
      notifyBadgeCountsChanged();
    }
  },
};
