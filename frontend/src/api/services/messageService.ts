import { USE_MOCK, http } from "../client";
import type { MyMessage, NoteRequest } from "../types";
import * as messages from "../mock/messages";
import { notifyBadgeCountsChanged } from "./badgeEvents";

interface ThreadSummary {
  id: number;
  topic: string;
  status: "WAITING" | "ANSWERED";
  createdAt: string;
  lastMessageAt: string;
  preview: string;
  linkedPractice: { id: number; title: string } | null;
}

interface ThreadDetail extends ThreadSummary {
  teacher?: { nickname: string } | null;
  messages:{ senderRole: "STUDENT" | "TEACHER"; body: string; createdAt: string }[];
}

const topicLabels: Record<string, string> = {
  FRIEND: "친구 관계",
  ONLINE: "온라인에서 생긴 일",
  SCHOOL: "학교생활",
  HOME: "집과 일상",
  ETC: "그 밖의 이야기",
};

const topicValues: Record<string, string> = Object.fromEntries(
  Object.entries(topicLabels).map(([value, label]) => [label, value]),
);

function messageDate(value: string): string {
  const [date, time] = value.split("T");
  const [, month, day] = date.split("-");
  const [hour, minute] = time.split(":");
  return `${Number(month)}월 ${Number(day)}일 ${hour}:${minute}`;
}

/**
 * 목록용: 요약만으로 만듭니다. (GET /threads/{id} 는 상대 메시지를 읽음 처리하므로
 * 목록을 열 때 모든 쪽지의 상세를 부르면 열지 않은 쪽지도 읽음이 됩니다.)
 */
function toListMessage(summary: ThreadSummary): MyMessage {
  const sentDate = messageDate(summary.createdAt).split(" ")[0];
  const answered = summary.status === "ANSWERED";
  const lastDate = messageDate(summary.lastMessageAt).split(" ")[0];

  return {
    id: String(summary.id),
    topic: topicLabels[summary.topic] ?? summary.topic,
    date: answered ? `${sentDate} 보냄 · ${lastDate} 답변` : `${sentDate} 보냄`,
    st: answered ? "reply" : "wait",
    scenario: summary.linkedPractice?.title ?? "",
    thread: [["l", `${messageDate(summary.createdAt)} · 내가 보낸 쪽지`, summary.preview]],
    loaded: false,
  };
}

/** 상세용: 사용자가 쪽지를 열었을 때만 부릅니다. */
function toDetailMessage(summary: ThreadSummary, detail: ThreadDetail): MyMessage {
  const sentDate = messageDate(summary.createdAt).split(" ")[0];
  const reply = detail.messages.find((message) => message.senderRole === "TEACHER");
  const replyDate = reply ? messageDate(reply.createdAt).split(" ")[0] : "";
  const teacherName = detail.teacher?.nickname
    ? `${detail.teacher.nickname} 이음쌤`
    : "이음쌤";

  return {
    id: String(summary.id),
    topic: topicLabels[summary.topic] ?? summary.topic,
    date: reply ? `${sentDate} 보냄 · ${replyDate} 답변` : `${sentDate} 보냄`,
    st: summary.status === "ANSWERED" ? "reply" : "wait",
    scenario: summary.linkedPractice?.title ?? "",
    thread: detail.messages.map((message) => [
      message.senderRole === "STUDENT" ? "l" : "t",
      `${messageDate(message.createdAt)} · ${
        message.senderRole === "STUDENT" ? "내가 보낸 쪽지" : `${teacherName}의 답변`
      }`,
      message.body,
    ]),
    loaded: true,
  };
}

/** 이음상담소 쪽지 (학습자 쪽) */
export const messageService = {
  /** GET /threads and GET /threads/{id} */
  async getMyMessages(): Promise<MyMessage[]> {
    if (USE_MOCK) return messages.myMessages;
    const response = await http<{ items: ThreadSummary[] }>("GET", "/threads");
    return response.items.map(toListMessage);
  },
  /** GET /threads/{id} — 쪽지를 열 때만 부릅니다(상대 메시지가 읽음 처리돼요). */
  async getMessageDetail(id: string): Promise<MyMessage> {
    if (USE_MOCK) {
      const found = messages.myMessages.find((message) => message.id === id);
      if (!found) throw new Error("쪽지를 찾을 수 없어요.");
      return found;
    }
    const detail = await http<ThreadDetail>("GET", `/threads/${encodeURIComponent(id)}`);
    const message = toDetailMessage(detail, detail);
    notifyBadgeCountsChanged();
    return message;
  },
  /** POST /threads — 새 쪽지 쓰기 */
  async sendNote(req: NoteRequest): Promise<void> {
    if (USE_MOCK) return;
    const topic = topicValues[req.topic];
    if (!topic) throw new Error("유효한 쪽지 주제를 선택해 주세요.");
    await http("POST", "/threads", { topic, body: req.body });
    notifyBadgeCountsChanged();
  },
  /** POST /threads/{id}/messages — 받은 답변에 이어서 쓰기 */
  async sendFollowUp(messageId: string, text: string): Promise<void> {
    if (USE_MOCK) return;
    await http("POST", `/threads/${encodeURIComponent(messageId)}/messages`, { body: text });
    notifyBadgeCountsChanged();
  },
};
