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
  messages: { senderRole: "STUDENT" | "TEACHER"; body: string; createdAt: string }[];
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

async function toMyMessage(summary: ThreadSummary): Promise<MyMessage> {
  const detail = await http<ThreadDetail>("GET", `/threads/${summary.id}`);
  const sentDate = messageDate(summary.createdAt).split(" ")[0];
  const reply = detail.messages.find((message) => message.senderRole === "TEACHER");
  const replyDate = reply ? messageDate(reply.createdAt).split(" ")[0] : "";

  return {
    id: String(summary.id),
    topic: topicLabels[summary.topic] ?? summary.topic,
    date: reply
      ? `${sentDate} 보냄 · ${replyDate} 답변`
      : `${sentDate} 보냄`,
    st: summary.status === "ANSWERED" ? "reply" : "wait",
    scenario: summary.linkedPractice?.title ?? "",
    thread: detail.messages.map((message) => [
      message.senderRole === "STUDENT" ? "l" : "t",
      `${messageDate(message.createdAt)} · ${
        message.senderRole === "STUDENT" ? "내가 보낸 쪽지" : "푸른 이음쌤의 답변"
      }`,
      message.body,
    ]),
  };
}

/** 이음상담소 쪽지 (학습자 쪽) */
export const messageService = {
  /** GET /threads and GET /threads/{id} */
  async getMyMessages(): Promise<MyMessage[]> {
    if (USE_MOCK) return messages.myMessages;
    const response = await http<{ items: ThreadSummary[] }>("GET", "/threads");
    const result = await Promise.all(response.items.map(toMyMessage));
    notifyBadgeCountsChanged();
    return result;
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
