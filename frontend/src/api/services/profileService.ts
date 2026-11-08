import { USE_MOCK, http } from "../client";
import type { Profile } from "../types";

/** 내 정보 */
export const profileService = {
  /** GET /me */
  async getProfile(): Promise<Profile> {
    if (USE_MOCK) return { nick: "하늘", mail: "", notifications: [true, true, false] };
    return http("GET", "/me");
  },
  /** PATCH /me */
  async updateProfile(req: { nick: string; mail: string }): Promise<void> {
    if (USE_MOCK) return;
    return http("PATCH", "/me", req);
  },
  /** PUT /me/password */
  async changePassword(req: { current: string; next: string }): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", "/me/password", req);
  },
  /** PUT /me/notification-prefs */
  async updateNotificationPrefs(prefs: boolean[]): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", "/me/notification-prefs", { prefs });
  },
  /** DELETE /me — 탈퇴 */
  async withdraw(): Promise<void> {
    if (USE_MOCK) return;
    return http("DELETE", "/me");
  },
};
