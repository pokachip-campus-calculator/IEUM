import { USE_MOCK, http } from "../client";
import type { LearningRecord } from "../types";
import * as records from "../mock/records";

/** 학습 기록 */
export const recordService = {
  /** GET /records */
  async getLearningRecords(): Promise<LearningRecord[]> {
    if (USE_MOCK) return records.learningRecords;
    return http("GET", "/records");
  },
  /** POST /records/scenario — 시나리오 연습의 "했어요 기록" 저장 */
  async saveScenarioReflection(req: {
    scenario: string;
    choice: number | null;
    feelings: string[];
    note: string;
  }): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/records/scenario", req);
  },
  /** POST /records/emotion — 감정 읽기에서 고른 단서·마음 저장 */
  async saveEmotionReading(req: { clues: string[]; feelings: string[] }): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/records/emotion", req);
  },
  /** POST /records/units — 학습 단위(질문지 사전·사후 답) 마침 */
  async completeUnit(req: {
    kind: "cards" | "video";
    level?: string;
    pre: Record<number, number>;
    post: Record<number, number>;
  }): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/records/units", req);
  },
};
