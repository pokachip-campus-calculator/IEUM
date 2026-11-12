/**
 * 라우트 경로 상수 — 화면 간 이동은 문자열 대신 이 상수를 사용합니다.
 * (원본 디자인의 'Home.dc.html' 같은 파일 링크가 이 경로로 바뀌었어요.)
 */
export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  terms: "/terms",
  home: "/home",
  areas: "/areas",
  unit: "/unit",
  unitVideo: "/unit/video",
  scenario: "/scenario",
  emotion: "/emotion",
  collection: "/collection",
  talk: "/talk",
  messages: "/messages",
  help: "/help",
  profile: "/profile",
  notifications: "/notifications",
  teacher: "/teacher",
  teacherMessages: "/teacher/messages",
  teacherSignal: "/teacher/signal",
  teacherUpload: "/teacher/upload",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** 화면 번호(S01~S15, T01~T04)와 브라우저 탭 제목 */
export const ROUTE_META: { key: RouteKey; code: string; path: string; title: string }[] = [
  { key: "landing", code: "S01", path: ROUTES.landing, title: "이음 · 처음 화면" },
  { key: "login", code: "S02", path: ROUTES.login, title: "로그인" },
  { key: "signup", code: "S03", path: ROUTES.signup, title: "회원 가입" },
  { key: "terms", code: "S04", path: ROUTES.terms, title: "약관 전문" },
  { key: "home", code: "S05", path: ROUTES.home, title: "이음 홈" },
  { key: "areas", code: "S06", path: ROUTES.areas, title: "학습 영역" },
  { key: "unit", code: "S07", path: ROUTES.unit, title: "학습 단위" },
  { key: "unitVideo", code: "S07-2", path: ROUTES.unitVideo, title: "학습 단위 · 영상" },
  { key: "scenario", code: "S08", path: ROUTES.scenario, title: "시나리오 연습" },
  { key: "emotion", code: "S09", path: ROUTES.emotion, title: "감정 읽기" },
  { key: "collection", code: "S10", path: ROUTES.collection, title: "내 학습 기록" },
  { key: "talk", code: "S11", path: ROUTES.talk, title: "이음상담소" },
  { key: "messages", code: "S12", path: ROUTES.messages, title: "내 쪽지함" },
  { key: "help", code: "S13", path: ROUTES.help, title: "도움 받을 수 있는 곳" },
  { key: "profile", code: "S14", path: ROUTES.profile, title: "내 정보" },
  { key: "notifications", code: "S15", path: ROUTES.notifications, title: "알림" },
  { key: "teacher", code: "T01", path: ROUTES.teacher, title: "이음쌤 홈" },
  { key: "teacherMessages", code: "T02", path: ROUTES.teacherMessages, title: "쪽지 모아 보기" },
  { key: "teacherSignal", code: "T03", path: ROUTES.teacherSignal, title: "신호 대응 기록" },
  { key: "teacherUpload", code: "T04", path: ROUTES.teacherUpload, title: "강의 자료 올리기" },
];
