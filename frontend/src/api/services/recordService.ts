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

/** selectedIds의 반대: 서버 id("f1")를 화면에서 쓰는 문구로 되돌려요. 모르는 id는 건너뛰어요. */
function labelsOf(ids: unknown, choices: string[], prefix: string): string[] {
  if (!Array.isArray(ids)) return [];
  return ids.flatMap((id) => {
    const index = Number(String(id).replace(prefix, "")) - 1;
    return Number.isInteger(index) && index >= 0 && index < choices.length ? [choices[index]] : [];
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
  /** 저장된 학습 단위 진행 기록을 화면 state(문항 번호→보기 번호)로 되돌려요. 진행 중 기록이 아니면 null. */
  restoreUnitProgress(
    record: { status: string; answers: Record<string, unknown> } | null | undefined,
  ): { pre: Record<number, number>; post: Record<number, number>; cardsRead: number[] } | null {
    if (!record || record.status !== "IN_PROGRESS") return null;
    const indexes = (answers: unknown): Record<number, number> =>
      Object.fromEntries(
        Object.entries((answers ?? {}) as Record<string, string>).flatMap(([questionId, optionId]) => {
          const questionIndex = Number(questionId.replace(/^q/, "")) - 1;
          const optionIndex = ["a", "b", "c", "d", "e"].indexOf(optionId);
          return questionIndex >= 0 && optionIndex >= 0 ? [[questionIndex, optionIndex]] : [];
        }),
      );
    const cardsRead = record.answers.cardsRead;
    return {
      pre: indexes(record.answers.pre),
      post: indexes(record.answers.post),
      cardsRead: Array.isArray(cardsRead) ? (cardsRead as number[]) : [],
    };
  },
  /** PUT /practices/2/record {done:false} — "잠시 쉬기"에서 지금까지 고른 것을 진행 중으로 저장해요. */
  async saveScenarioProgress(req: {
    practiceId: number;
    choice: number | null;
    feelings: string[];
    note: string;
  }): Promise<void> {
    if (USE_MOCK) return;
    const answers: Record<string, unknown> = {};
    if (req.choice !== null) answers.choice = `c${req.choice + 1}`;
    const feelings = selectedIds(req.feelings, scenarioFeelings, "f");
    if (feelings.length > 0) answers.feelings = feelings;
    if (Object.keys(answers).length === 0 && req.note.trim() === "") return; // 저장할 게 없어요
    await http("PUT", `/practices/${req.practiceId}/record`, {
      answers,
      myNote: req.note,
      done: false,
    });
  },
  /** 저장된 시나리오 진행 기록을 화면 state(고른 방법 번호·마음·한 줄)로 되돌려요. */
  restoreScenarioProgress(
    record: { status: string; answers: Record<string, unknown>; myNote: string | null } | null | undefined,
    choiceCount: number,
  ): { pick: number | null; feels: string[]; note: string } | null {
    if (!record || record.status !== "IN_PROGRESS") return null;
    const choiceIndex = Number(String(record.answers.choice ?? "").replace(/^c/, "")) - 1;
    const pick =
      Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < choiceCount
        ? choiceIndex
        : null;
    return {
      pick,
      feels: labelsOf(record.answers.feelings, scenarioFeelings, "f"),
      note: record.myNote ?? "",
    };
  },
  /** PUT /practices/3/record {done:false} — "잠시 쉬기"에서 지금까지 고른 단서·마음을 진행 중으로 저장해요. */
  async saveEmotionProgress(req: {
    practiceId: number;
    clues: string[];
    feelings: string[];
  }): Promise<void> {
    if (USE_MOCK) return;
    const clues = selectedIds(req.clues, emotionClues, "k");
    const feelings = selectedIds(req.feelings, emotionFeelings, "f");
    if (clues.length + feelings.length === 0) return; // 저장할 게 없어요
    await http("PUT", `/practices/${req.practiceId}/record`, {
      answers: { clues, feelings },
      done: false,
    });
  },
  /** 저장된 감정 읽기 진행 기록을 화면 state(단서·마음 이름)로 되돌려요. */
  restoreEmotionProgress(
    record: { status: string; answers: Record<string, unknown> } | null | undefined,
  ): { clues: string[]; feels: string[] } | null {
    if (!record || record.status !== "IN_PROGRESS") return null;
    return {
      clues: labelsOf(record.answers.clues, emotionClues, "k"),
      feels: labelsOf(record.answers.feelings, emotionFeelings, "f"),
    };
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
    /** 서버 연습의 카드 수(영상 단위용). 없으면 카드 학습처럼 5장으로 봐요. */
    cardCount?: number;
  }): Promise<void> {
    // 영상 단위도 서버에서는 같은 학습 단위(UNIT) 기록이에요. 마칠 때는 사전·사후 답과 카드를 모두 읽은 것으로 보내요.
    const cards = req.kind === "video" ? (req.cardCount ?? 0) : 5;
    return this.saveUnitProgress({
      practiceId: req.practiceId,
      pre: req.pre,
      post: req.post,
      cardsRead: Array.from({ length: cards }, (_, i) => i + 1),
      done: true,
    });
  },
};
