import { session, syncSessionUser } from "./session";

/**
 * API 호출 공통 도구.
 *
 *  - VITE_USE_MOCK=false 로 두면 services 가 아래 http() 로 실제 서버를 부릅니다. (기본값: 목업 사용)
 *  - VITE_API_BASE_URL 로 서버 주소를 바꿀 수 있어요. (기본값: /api)
 */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== "false";
export const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
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
    try {
      const data = await res.json();
      if (data?.fieldErrors?.[0]?.message) msg = data.fieldErrors[0].message;
      else if (data?.message) msg = data.message;
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 사용 */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
