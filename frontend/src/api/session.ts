import type { SessionUser } from "./types";

/**
 * 로그인한 사용자 정보를 화면(헤더·홈 인사말 등)이 읽는 곳.
 * 로그인/내 정보 API 가 생기면 setSessionUser() 로 채워 주세요. (지금은 디자인 속 예시 사용자입니다.)
 */
export const session: { user: SessionUser } = {
  user: { nick: "하늘", role: "learner" },
};

export function setSessionUser(user: SessionUser): void {
  session.user = user;
}
