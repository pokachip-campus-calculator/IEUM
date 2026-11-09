import type { SessionUser } from "./types";

const STORAGE_KEY = "ieum.session";

interface SavedSession {
  user: SessionUser;
  token: string;
  expiresAt: string;
}

function readSavedSession(): SavedSession | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<SavedSession>;
    const expiration = parsed.expiresAt ? Date.parse(parsed.expiresAt) : NaN;
    if (
      !parsed.token ||
      !parsed.user ||
      !Number.isFinite(expiration) ||
      expiration <= Date.now()
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed as SavedSession;
  } catch {
    return null;
  }
}

const savedSession = readSavedSession();

/** 로그인한 사용자 정보와 인증 토큰 */
export const session: {
  user: SessionUser;
  token: string | null;
  expiresAt: string | null;
} = {
  user: savedSession?.user ?? { id: 0, nick: "", role: "learner" },
  token: savedSession?.token ?? null,
  expiresAt: savedSession?.expiresAt ?? null,
};

export function syncSessionUser(): void {
  const saved = readSavedSession();
  session.user = saved?.user ?? { id: 0, nick: "", role: "learner" };
  session.token = saved?.token ?? null;
  session.expiresAt = saved?.expiresAt ?? null;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) syncSessionUser();
  });
}

/** 로그인 성공 시 사용자 정보와 토큰 저장 */
export function setSessionUser(
  user: SessionUser,
  token: string,
  expiresAt?: string,
): void {
  session.user = user;
  session.token = token;
  session.expiresAt = expiresAt ?? session.expiresAt;

  if (session.expiresAt && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, token, expiresAt: session.expiresAt }),
      );
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
}

export function clearSessionUser(): void {
  session.user = { id: 0, nick: "", role: "learner" };
  session.token = null;
  session.expiresAt = null;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
}