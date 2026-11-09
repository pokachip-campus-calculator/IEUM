import { USE_MOCK, http } from "../client";
import type { PracticeArea, PracticeItem, PracticeStatus, PracticeType } from "../types";
import * as learning from "../mock/learning";

interface PracticeListResponse {
  items: PracticeItem[];
}

export interface PracticeDetailResponse {
  id: number;
  type: PracticeType;
  area: PracticeArea;
  topic: string;
  level: number;
  title: string;
  summary: string;
  estMinutes: number;
  content: Record<string, unknown>;
  record: {
    status: PracticeStatus;
    answers: Record<string, unknown>;
    myNote: string | null;
    updatedAt: string;
    completedAt: string | null;
  } | null;
}

const areaOf = { safe: "SAFETY", help: "RELATION", emo: "MIND" } as const;
const typeOf: Record<keyof typeof areaOf, PracticeType> = {
  safe: "UNIT",
  help: "SCENARIO",
  emo: "EMOTION",
};
const statusOf = { done: "DONE", doing: "IN_PROGRESS", next: "NONE" } as const;

/** 학습자별 진행 상태가 포함된 연습 목록 */
export const practiceService = {
  /** GET /practices/{id} */
  async getPractice(id: number): Promise<PracticeDetailResponse> {
    if (USE_MOCK) {
      throw new Error("연습 상세 API는 목업 모드에서 제공되지 않습니다.");
    }
    return http("GET", `/practices/${id}`);
  },

  /** GET /practices?area=&level=&q= */
  async getPractices(filters: { area?: PracticeArea; level?: number; q?: string } = {}): Promise<PracticeItem[]> {
    if (USE_MOCK) {
      return learning.practiceRows.map((row, index) => ({
        id: index + 1,
        type: typeOf[row[2] as keyof typeof typeOf],
        area: areaOf[row[2] as keyof typeof areaOf],
        topic: row[6],
        level: row[3] + 1,
        title: row[0],
        summary: row[1],
        estMinutes: 10,
        myStatus: statusOf[row[4] as keyof typeof statusOf],
      }));
    }

    const query = new URLSearchParams();
    if (filters.area) query.set("area", filters.area);
    if (filters.level !== undefined) query.set("level", String(filters.level));
    if (filters.q) query.set("q", filters.q);
    const suffix = query.size ? `?${query.toString()}` : "";
    const response = await http<PracticeListResponse>("GET", `/practices${suffix}`);
    return response.items;
  },
};
