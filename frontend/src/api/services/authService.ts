import { ApiError, USE_MOCK, http } from "../client";
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      return await http<LoginResponse>("POST", "/auth/login", req, {
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError(408, "로그인 서버 응답이 늦어요. 잠시 후 다시 시도해 주세요.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
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
