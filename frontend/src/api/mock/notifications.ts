/**
 * 목업 데이터 — 알림(S15)
 * 백엔드가 준비되면 이 파일 대신 services 가 실제 API 응답을 돌려줍니다.
 * (원본 디자인 화면에 들어 있던 샘플 데이터를 그대로 옮겼어요.)
 */
import { ROUTES } from "@/routes";
import type { AppNotification } from "../types";

export const notificationsByRole: Record<"learner" | "teacher", AppNotification[]> = {
  learner: [
    {
      id: "l1",
      type: "msg",
      group: "오늘",
      when: "오늘 오전 10:20",
      title: "이음쌤이 쪽지를 읽었어요",
      body: "‘온라인에서 생긴 일’ 쪽지를 이음쌤이 확인했어요. 바로 답이 오지 않을 수 있어요.",
      href: ROUTES.messages,
      unread: true,
    },
    {
      id: "l2",
      type: "done",
      group: "이번 주",
      when: "11월 1일 오후 4:05",
      title: "이음쌤이 배정됐어요",
      body: "푸른 이음쌤이 내 쪽지를 맡게 됐어요. 내 정보에서 확인할 수 있어요.",
      href: ROUTES.profile,
      unread: true,
    },
    {
      id: "l3",
      type: "reply",
      group: "이전",
      when: "10월 29일 오전 11:30",
      title: "이음쌤이 답장을 보냈어요",
      body: "‘단톡방 이야기’ 쪽지에 답변이 도착했어요. 내 쪽지함에서 읽어 봐요.",
      href: ROUTES.messages,
      unread: true,
    },
    {
      id: "l4",
      type: "reply",
      group: "이전",
      when: "10월 13일 오전 10:02",
      title: "이음쌤이 답장을 보냈어요",
      body: "‘친구랑 다툰 일’ 쪽지에 답변이 도착했어요.",
      href: ROUTES.messages,
      unread: false,
    },
  ],
  teacher: [
    {
      id: "t1",
      type: "msg",
      group: "오늘",
      when: "오늘 오전 9:12",
      title: "바다님이 쪽지를 보냈어요",
      body: "답장이 필요해요. 쪽지 모아 보기에서 확인해요.",
      href: ROUTES.teacherMessages,
      unread: true,
    },
    {
      id: "t2",
      type: "signal",
      group: "오늘",
      when: "오늘 오전 9:12",
      title: "확인이 필요한 신호가 있어요",
      body: "신호 대응 기록에서 확인해 주세요. 지금 위험해 보이면 쪽지보다 먼저 번호로 안내해요.",
      href: ROUTES.teacherSignal,
      unread: true,
    },
    {
      id: "t3",
      type: "done",
      group: "이번 주",
      when: "11월 1일 오후 4:05",
      title: "새 학습자가 배정됐어요",
      body: "하늘님이 배정됐어요. 이음쌤 홈에서 활동 기록을 볼 수 있어요.",
      href: ROUTES.teacher,
      unread: true,
    },
    {
      id: "t4",
      type: "msg",
      group: "이전",
      when: "10월 28일 오후 2:40",
      title: "구름님이 쪽지를 보냈어요",
      body: "답장이 필요해요. 쪽지 모아 보기에서 확인해요.",
      href: ROUTES.teacherMessages,
      unread: false,
    },
  ],
};
