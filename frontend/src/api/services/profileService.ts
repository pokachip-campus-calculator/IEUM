import { USE_MOCK, http } from "../client";
import type { Profile } from "../types";

interface MeResponse {
  loginId: string;
  nickname: string;
  email: string | null;
  teacher: { id: number; nickname: string } | null;
}

type ProfileData = Profile & {
  loginId: string;
  teacher: MeResponse["teacher"];
};

/** 내 정보 */
export const profileService = {
  /** GET /me */
  async getProfile(): Promise<ProfileData> {
    if (USE_MOCK) {
      return {
        loginId: "haneul01",
        nick: "하늘",
        mail: "",
        notifications: [true, true, false],
        teacher: null,
      };
    }
    const me = await http<MeResponse>("GET", "/me");
    return {
      loginId: me.loginId,
      nick: me.nickname,
      mail: me.email ?? "",
      notifications: [true, true, false],
      teacher: me.teacher,
    };
  },
  /** PATCH /me */
  async updateProfile(req: { nick: string; mail: string }): Promise<void> {
    if (USE_MOCK) return;
    return http("PATCH", "/me", { nickname: req.nick, email: req.mail });
  },
  /** PUT /me/password */
  async changePassword(req: { current: string; next: string }): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", "/me/password", {
      currentPassword: req.current,
      newPassword: req.next,
    });
  },
  /** PUT /me/notification-prefs */
  async updateNotificationPrefs(prefs: boolean[]): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", "/me/notification-prefs", { prefs });
  },
  /** POST /me/withdraw — 탈퇴 */
  async withdraw(): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/me/withdraw");
  },
};
