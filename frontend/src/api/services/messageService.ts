import { USE_MOCK, http } from "../client";
import type { MyMessage, NoteRequest } from "../types";
import * as messages from "../mock/messages";

/** 이음상담소 쪽지 (학습자 쪽) */
export const messageService = {
  /** GET /messages */
  async getMyMessages(): Promise<MyMessage[]> {
    if (USE_MOCK) return messages.myMessages;
    return http("GET", "/messages");
  },
  /** POST /messages — 새 쪽지 쓰기 */
  async sendNote(req: NoteRequest): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/messages", req);
  },
  /** POST /messages/:id/replies — 받은 답변에 이어서 쓰기 */
  async sendFollowUp(messageId: string, text: string): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", `/messages/${encodeURIComponent(messageId)}/replies`, { text });
  },
};
