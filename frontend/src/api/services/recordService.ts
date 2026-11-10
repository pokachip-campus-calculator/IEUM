import { USE_MOCK, http } from "../client";
import type { LearningRecord, PracticeArea, PracticeType } from "../types";
import * as records from "../mock/records";

interface ApiLearningRecord {
  practiceId: number;
  title: string;
  type: PracticeType;
  area: PracticeArea;
  level: number;
  status: "DONE" | "IN_PROGRESS";
  completedAt: string | null;
  updatedAt: string;
  myNote: string | null;
  compare: { text: string; then: string; now: string }[] | null;
}

interface ApiLearningRecordsResponse {
  items: ApiLearningRecord[];
}

const areaLabel = {
  SAFETY: "safe",
  HELP: "rel",
  EMOTION: "mind",
  RELATION: "rel",
  MIND: "mind",
  LIFE: "life",
  INDEPENDENCE: "indep",
} as const;

function formatRecordDate(value: string): { date: string; key: number } {
  const [month, day] = value.slice(0, 10).split("-").slice(1).map(Number);
  return {
    date: `${month}월 ${day}일`,
    key: month * 100 + day,
  };
}

const scenarioFeelings = ["불편했어요", "헷갈렸어요", "괜찮았어요", "누군가에게 말하고 싶어졌어요"];
const emotionClues = [
  "표정 · 시선을 아래로 향해요",
  "목소리 · 말수가 줄었어요",
  "몸짓 · 어깨가 처져 있어요",
  "하는 말 · “나 괜찮아”라고 짧게 말했어요",
  "앞뒤 상황 · 대화가 끝나자 혼자 떨어져 앉았어요",
];
const emotionFeelings = ["서운함", "걱정", "당황", "외로움", "잘 모르겠어요"];

function selectedIds(values: string[], choices: string[], prefix: string): string[] {
  return values.flatMap((value) => {
    const index = choices.indexOf(value);
    return index < 0 ? [] : [`${prefix}${index + 1}`];
  });
}

/** 학습 기록 */
export const recordService = {
  /** GET /records */
  async getLearningRecords(): Promise<LearningRecord[]> {
    if (USE_MOCK) return records.learningRecords;
    const response = await http<ApiLearningRecordsResponse>("GET", "/records");
    return response.items.map((item) => {
      const { date, key } = formatRecordDate(item.completedAt ?? item.updatedAt);
      return {
        id: String(item.practiceId),
        practiceId: item.practiceId,
        type: item.type,
        d: key,
        date,
        area: areaLabel[item.area],
        lv: item.level - 1,
        st: item.status === "DONE" ? "done" : "doing",
        title: item.title,
        memo: item.myNote || undefined,
        rows: (item.compare ?? []).map((row) => [row.text, row.then, row.now]),
      };
    });
  },
  /** PUT /practices/{id}/record {restart:true} — 기록을 처음부터 다시 시작해요("다시 연습"). */
  async restartPractice(practiceId: number): Promise<void> {
    if (USE_MOCK) return;
    await http("PUT", `/practices/${practiceId}/record`, { restart: true });
  },
  /** PUT /practices/2/record — 시나리오 연습의 "했어요 기록" 저장 */
  async saveScenarioReflection(req: {
    practiceId: number;
    scenario: string;
    choice: number | null;
    feelings: string[];
    note: string;
  }): Promise<void> {
    if (USE_MOCK) return;
    if (req.choice === null) throw new Error("선택한 방법을 먼저 골라 주세요.");
    await http("PUT", `/practices/${req.practiceId}/record`, {
      answers: {
        choice: `c${req.choice + 1}`,
        feelings: selectedIds(req.feelings, scenarioFeelings, "f"),
      },
      myNote: req.note,
      done: true,
    });
  },
  /** PUT /practices/3/record — 감정 읽기에서 고른 단서·마음 저장 */
  async saveEmotionReading(req: {
    practiceId: number;
    clues: string[];
    feelings: string[];
  }): Promise<void> {
    if (USE_MOCK) return;
    await http("PUT", `/practices/${req.practiceId}/record`, {
      answers: {
        clues: selectedIds(req.clues, emotionClues, "k"),
        feelings: selectedIds(req.feelings, emotionFeelings, "f"),
      },
      done: true,
    });
  },
  /** PUT /practices/1/record — 카드 학습 질문지 사전·사후 답 저장 */
  async saveUnitProgress(req: {
    practiceId: number;
    pre: Record<number, number>;
    post: Record<number, number>;
    cardsRead: number[];
    done?: boolean;
  }): Promise<void> {
    if (USE_MOCK) return;
    const answersFor = (answers: Record<number, number>) =>
      Object.fromEntries(
        Object.entries(answers).map(([questionIndex, optionIndex]) => {
          const options = ["a", "b", "c", "d", "e"];
          if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
            throw new Error("선택한 답을 저장할 수 없습니다.");
          }
          return [`q${Number(questionIndex) + 1}`, options[optionIndex]];
        }),
      );
    await http("PUT", `/practices/${req.practiceId}/record`, {
      answers: {
        pre: answersFor(req.pre),
        cardsRead: req.cardsRead,
        post: answersFor(req.post),
      },
      done: req.done ?? false,
    });
  },
  /** PUT /practices/1/record — 카드 학습 완료 기록 */
  async completeUnit(req: {
    practiceId: number;
    kind: "cards" | "video";
    level?: string;
    pre: Record<number, number>;
    post: Record<number, number>;
  }): Promise<void> {
    if (req.kind === "video") {
      throw new Error("영상 연습 기록 저장 API는 아직 제공되지 않아 이 학습은 화면에만 표시돼요.");
    }
    return this.saveUnitProgress({
      practiceId: req.practiceId,
      pre: req.pre,
      post: req.post,
      cardsRead: [1, 2, 3, 4, 5],
      done: true,
    });
  },
};
