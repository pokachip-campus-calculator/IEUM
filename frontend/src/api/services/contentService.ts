import { USE_MOCK } from "../client";
import type {
  EmotionScene,
  ScenarioItem,
  TermsDoc,
  UnitContent,
  UnitVideoContent,
} from "../types";
import * as emotion from "../mock/emotion";
import * as scenario from "../mock/scenario";
import * as terms from "../mock/terms";
import * as unit from "../mock/unit";
import * as unitVideo from "../mock/unitVideo";
import { practiceService } from "./practiceService";
import type { PracticeDetailResponse } from "./practiceService";

type PracticeRecord = PracticeDetailResponse["record"];

interface ApiOption {
  id: string;
  label: string;
}

interface ApiQuestion {
  id: string;
  text: string;
  options: ApiOption[];
  compare: { best: string | null; reason: string };
}

interface ApiCard {
  title: string;
  l1: string;
  l2: string;
}

interface ApiScenario {
  scene: string;
  situation: string;
  choices: { id: string; text: string; follow: string; hear: string }[];
  remember: string[];
}

interface ApiEmotion {
  clues: { id: string; label: string }[];
  feelings: { id: string; label: string }[];
}

function mapQuestions(content: Record<string, unknown>): UnitContent["questions"] {
  const questions = content.questions as ApiQuestion[];
  return questions.map((question) => {
    if (question.options.length > 3) {
      return {
        t: "face",
        text: question.text,
        opts: question.options.map((option, index) => [
          option.label,
          unit.FACES[index]?.[1] ?? unit.FACES[0][1],
          unit.FACES[index]?.[2] ?? unit.FACES[0][2],
        ]),
        fr: question.compare.reason,
      };
    }

    return {
      t: "sit",
      text: question.text,
      opts: question.options.map((option) => option.label),
      best: Math.max(0, question.options.findIndex((option) => option.id === question.compare.best)),
      reason: question.compare.reason,
    };
  });
}

/** 학습 콘텐츠(영역 카드·질문지·영상·시나리오·약관 등) */
export const contentService = {
  /** GET /practices/1 */
  async getUnitContent(
    _level?: string,
    practiceId = 1,
  ): Promise<UnitContent & { record: PracticeDetailResponse["record"] | null }> {
    if (USE_MOCK) return { questions: unit.unitQuestions, cards: unit.unitCards, record: null };
    const practice = await practiceService.getPractice(practiceId);
    const cards = practice.content.cards as ApiCard[];
    return {
      questions: mapQuestions(practice.content),
      record: practice.record,
      cards: cards.map((card, index) => ({
        ...card,
        type: unit.unitCards[index]?.type ?? "학습",
        c1: unit.unitCards[index]?.c1 ?? "#B7A7FF",
        c2: unit.unitCards[index]?.c2 ?? "#D7EFE5",
      })),
    };
  },
  /** GET /practices/1; video media remains bundled because the API has no video endpoint. */
  async getUnitVideoContent(
    _level?: string,
    practiceId = 1,
  ): Promise<UnitVideoContent & { record: PracticeRecord }> {
    if (USE_MOCK) {
      return { questions: unitVideo.unitVideoQuestions, videos: unitVideo.unitVideos, record: null };
    }
    const practice = await practiceService.getPractice(practiceId);
    const cards = practice.content.cards as unknown[] | undefined;
    return {
      questions: mapQuestions(practice.content),
      videos: unitVideo.unitVideos,
      cardCount: Array.isArray(cards) ? cards.length : 0,
      record: practice.record,
    };
  },
  /** GET /practices/2 — 이어서 하기를 위해 저장된 기록(record)도 함께 돌려줘요. */
  async getScenarioContent(
    practiceId = 2,
  ): Promise<{ scenarios: Record<string, ScenarioItem>; record: PracticeRecord }> {
    if (USE_MOCK) return { scenarios: scenario.scenarios, record: null };
    const practice = await practiceService.getPractice(practiceId);
    const content = practice.content as unknown as ApiScenario;
    const base = scenario.scenarios.secret;
    return {
      scenarios: {
        secret: {
          ...base,
          title: practice.title,
          alt: content.scene,
          situation: content.situation,
          remember: content.remember,
          choices: content.choices.map(({ id, text, follow, hear }) => ({
            id,
            text,
            follow,
            hear,
          })),
        },
      },
      record: practice.record,
    };
  },
  /** GET /practices/3 */
  async getEmotionScene(practiceId = 3): Promise<EmotionScene & { record: PracticeRecord }> {
    if (USE_MOCK) {
      return { clues: emotion.emotionClues, feelings: emotion.emotionFeelings, record: null };
    }
    const practice = await practiceService.getPractice(practiceId);
    const content = practice.content as unknown as ApiEmotion;
    return {
      clues: content.clues.map(({ label }) => label),
      feelings: content.feelings.map(({ label }) => label),
      record: practice.record,
    };
  },
  /** GET /content/terms */
  async getTerms(): Promise<Record<string, TermsDoc>> {
    return terms.termsDocs;
  },
};
