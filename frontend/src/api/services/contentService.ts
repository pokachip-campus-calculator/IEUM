import { USE_MOCK, http } from "../client";
import type {
  EmotionScene,
  PracticeRow,
  ScenarioItem,
  TermsDoc,
  UnitContent,
  UnitVideoContent,
} from "../types";
import * as emotion from "../mock/emotion";
import * as learning from "../mock/learning";
import * as scenario from "../mock/scenario";
import * as terms from "../mock/terms";
import * as unit from "../mock/unit";
import * as unitVideo from "../mock/unitVideo";

/** 학습 콘텐츠(영역 카드·질문지·영상·시나리오·약관 등) */
export const contentService = {
  /** GET /content/practices */
  async getPractices(): Promise<PracticeRow[]> {
    if (USE_MOCK) return learning.practiceRows;
    return http("GET", "/content/practices");
  },
  /** GET /content/units/cards?level= */
  async getUnitContent(level?: string): Promise<UnitContent> {
    if (USE_MOCK) return { questions: unit.unitQuestions, cards: unit.unitCards };
    return http("GET", `/content/units/cards?level=${encodeURIComponent(level ?? "")}`);
  },
  /** GET /content/units/videos?level= */
  async getUnitVideoContent(level?: string): Promise<UnitVideoContent> {
    if (USE_MOCK) return { questions: unitVideo.unitVideoQuestions, videos: unitVideo.unitVideos };
    return http("GET", `/content/units/videos?level=${encodeURIComponent(level ?? "")}`);
  },
  /** GET /content/scenarios */
  async getScenarios(): Promise<Record<string, ScenarioItem>> {
    if (USE_MOCK) return scenario.scenarios;
    return http("GET", "/content/scenarios");
  },
  /** GET /content/emotion */
  async getEmotionScene(): Promise<EmotionScene> {
    if (USE_MOCK) return { clues: emotion.emotionClues, feelings: emotion.emotionFeelings };
    return http("GET", "/content/emotion");
  },
  /** GET /content/terms */
  async getTerms(): Promise<Record<string, TermsDoc>> {
    if (USE_MOCK) return terms.termsDocs;
    return http("GET", "/content/terms");
  },
};
