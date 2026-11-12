import { session, syncSessionUser } from "./session";

/**
 * API 호출 공통 도구.
 *
 *  - VITE_USE_MOCK=false 로 두면 services 가 아래 http() 로 실제 서버를 부릅니다.
 *    개발 모드(npm run dev)에서는 기본값이 목업 사용이고,
 *    프로덕션 빌드에서는 값이 비어 있어도 목업을 쓰지 않습니다.
 *  - VITE_API_BASE_URL 로 서버 주소를 바꿀 수 있어요. (개발 모드 기본값: /api)
 *    프로덕션 빌드에서 비어 있으면 화면에 오류 배너를 보여줍니다.
 */
export const USE_MOCK: boolean = !import.meta.env.PROD && import.meta.env.VITE_USE_MOCK !== "false";

const envApiBase = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").trim();

/** 프로덕션 빌드인데 서버 주소가 설정되지 않은 경우 */
export const API_BASE_MISSING: boolean = import.meta.env.PROD && envApiBase === "";
export const API_BASE: string = envApiBase !== "" ? envApiBase : import.meta.env.PROD ? "" : "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function http<T = void>(
  method: Method,
  path: string,
  body?: unknown,
  options?: Pick<RequestInit, "signal">,
): Promise<T> {
  syncSessionUser();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (session.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(API_BASE + path, {
    method,
    credentials: "include",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options?.signal,
  });
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    let code: string | undefined;
    try {
      const data = await res.json();
      if (typeof data?.code === "string") code = data.code;
      if (data?.fieldErrors?.[0]?.message) msg = data.fieldErrors[0].message;
      else if (data?.message) msg = data.message;
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 사용 */
    }
    throw new ApiError(res.status, msg, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
