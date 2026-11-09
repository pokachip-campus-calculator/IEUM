import { USE_MOCK, http } from "../client";
import type { GuardianConsentRequest, LoginRequest, LoginResponse, SignupRequest } from "../types";

/** 로그인 · 회원 가입 */
export const authService = {
  /** POST /auth/login */
  async login(req: LoginRequest): Promise<LoginResponse> {
    if (USE_MOCK) {
      return {
        token: "mock-token",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user: { id: 0, nickname: "하늘", role: "STUDENT" },
      };
    }
    return http<LoginResponse>("POST", "/auth/login", req);
  },
  /** POST /auth/signup  (14세 미만이면 이어서 requestGuardianConsent) */
  async signup(req: SignupRequest): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/auth/signup", req);
  },
  /** POST /auth/guardian-consent */
  async requestGuardianConsent(req: GuardianConsentRequest): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/auth/guardian-consent", req);
  },
  /** POST /auth/email-code — 이메일 인증번호 보내기 */
  async sendEmailCode(email: string): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/auth/email-code", { email });
  },
};
