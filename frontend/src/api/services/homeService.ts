import { USE_MOCK, http } from "../client";
import type { HomeResponse } from "../types";
import { home } from "../mock/home";

/** 학습자 홈 */
export const homeService = {
  /** GET /home */
  async getHome(): Promise<HomeResponse> {
    if (USE_MOCK) return home;
    return http("GET", "/home");
  },
};
