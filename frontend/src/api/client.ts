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

export async function http<T = void>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
