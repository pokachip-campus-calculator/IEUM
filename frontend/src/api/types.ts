/**
 * API 로 주고받는 데이터 형태(타입) 모음.
 * 백엔드 응답을 이 모양에 맞추면 화면 코드는 고치지 않아도 됩니다.
 */

/* ---------- 사용자 ---------- */
export type UserRole = "learner" | "teacher";

export interface SessionUser {
  id: number;
  nick: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: number;
    nickname: string;
    role: "STUDENT" | "TEACHER";
  };
}

export interface Profile {
  nick: string;
  mail: string;
  /** [답변이 도착하면, 이어서 할 연습이 있으면, 새 연습이 열리면] */
  notifications: boolean[];
}

/* ---------- 홈·연습 목록 ---------- */
/** 서버는 SAFETY/HELP/EMOTION 을 내려주고, RELATION/MIND 등은 화면 기준 이름이라 둘 다 받습니다. */
export type PracticeArea =
  | "SAFETY"
  | "HELP"
  | "EMOTION"
  | "RELATION"
  | "MIND"
  | "LIFE"
  | "INDEPENDENCE";
export type PracticeType = "UNIT" | "SCENARIO" | "EMOTION";
export type PracticeStatus = "NONE" | "IN_PROGRESS" | "DONE";

export interface PracticeItem {
  id: number;
  type: PracticeType;
  area: PracticeArea;
  topic: string;
  level: number;
  title: string;
  summary: string;
  estMinutes: number;
  myStatus: PracticeStatus;
}

export interface HomeResponse {
  nickname: string;
  unreadMessages: number;
  doneTotal: number;
  resume: {
    practiceId: number;
    title: string;
    type: PracticeType;
    area: PracticeArea;
    level: number;
    estMinutes: number;
    myStatus: PracticeStatus;
  } | null;
}

/* ---------- 학습 콘텐츠 ---------- */
/** [제목, 설명, 영역(emo|help|safe), 단계(0~4), 상태(done|doing|next), 이동 경로(없으면 ''), 분류 라벨] */
export type PracticeRow = [
  title: string,
  desc: string,
  area: string,
  level: number,
  status: string,
  href: string,
  tag: string,
];

/** [라벨, 입 모양 path, 배경색] */
export type FaceOption = [label: string, mouth: string, fill: string];

export interface SituationQuestion {
  t: "sit";
  text: string;
  opts: string[];
  best: number;
  reason: string;
}
export interface FaceQuestion {
  t: "face";
  text: string;
  opts: FaceOption[];
  fr: string;
}
export type UnitQuestion = SituationQuestion | FaceQuestion;

export interface UnitCard {
  type: string;
  title: string;
  l1: string;
  l2: string;
  c1: string;
  c2: string;
}

export interface UnitVideoItem {
  /** 길이(초) */
  dur: number;
  title: string;
  l1: string;
  l2: string;
  lines: string[];
}

export interface ScenarioChoice {
  text: string;
  follow: string;
  [key: string]: unknown;
}
export interface ScenarioItem {
  label: string;
  title: string;
  img: string;
  alt: string;
  situation: string;
  remember: string[];
  choices: ScenarioChoice[];
  [key: string]: unknown;
}

export interface TermsDoc {
  title: string;
  summary: string[];
  [key: string]: unknown;
}

export interface EmotionScene {
  clues: string[];
  feelings: string[];
}

export interface UnitContent {
  questions: UnitQuestion[];
  cards: UnitCard[];
}
export interface UnitVideoContent {
  questions: UnitQuestion[];
  videos: UnitVideoItem[];
  /** 서버 연습의 카드 수. 영상 단위를 마칠 때 카드를 모두 읽은 것으로 저장하려면 필요해요. */
  cardCount?: number;
}

/* ---------- 학습 기록 ---------- */
/** [질문, 그때 답, 지금 답] */
export type CompareRow = [question: string, before: string, after: string];

export interface LearningRecord {
  id: string;
  /** 연습 번호와 종류. "다시 연습"이 알맞은 화면(학습 단위·시나리오·감정 읽기)으로 가는 데 써요. 목업에는 없을 수 있어요. */
  practiceId?: number;
  type?: PracticeType;
  /** 정렬용 날짜 키 (예: 1031 = 10월 31일) */
  d: number;
  date: string;
  area: string;
  lv: number;
  st: "done" | "doing";
  title: string;
  memo?: string;
  rows: CompareRow[];
}

/* ---------- 쪽지 · 알림 ---------- */
export interface MyMessage {
  id: string;
  topic: string;
  date: string;
  st: "wait" | "reply";
  scenario: string;
  /** [l(학습자)|t(이음쌤), 머리글, 본문] */
  thread: [string, string, string][];
  /** 상세를 불러왔는지. false 면 thread 에 첫 쪽지 미리보기만 있어요. */
  loaded?: boolean;
}

export interface AppNotification {
  id: string;
  type: "reply" | "msg" | "signal" | "done";
  group: string;
  when: string;
  title: string;
  body: string;
  href: string;
  unread: boolean;
}

/* ---------- 이음쌤 ---------- */
export interface StudentNote {
  from: "l" | "t";
  date: string;
  sc: string;
  text: string;
}
export interface Student {
  id: string;
  nick: string;
  how: string;
  sig: boolean;
  last: string;
  key: number;
  since: string;
  stamps: [string, string][];
  unit: string;
  rows: CompareRow[];
  clues: string[];
  guess: string[];
  notes: StudentNote[];
}
/** 이음쌤 홈 요약(GET /teacher/summary) */
export interface TeacherSummary {
  studentCount: number;
  waitingThreadCount: number;
  openSignalCount: number;
}

/** 회원가입 응답: ACTIVE 면 바로 쓸 수 있고, PENDING_GUARDIAN 이면 보호자 확인을 기다려요. */
export interface SignupResponse {
  status: "ACTIVE" | "PENDING_GUARDIAN";
}

export interface TeacherMessage {
  id: string;
  nick: string;
  date: string;
  /** 신호가 하나라도 붙은 쪽지인지(처리해도 true로 남아요) */
  sig: boolean;
  /** 신호가 있을 때만: OPEN(처리 안 한 신호가 있음) · HANDLED(전부 처리). 신호가 없으면 null */
  sigStatus?: "OPEN" | "HANDLED" | null;
  scenario: string;
  picked: string;
  need: boolean;
  thread: [string, string, string][];
}
export interface SignalStudent {
  id: string;
  nick: string;
  since: string;
  seen: string;
  msgDate: string;
  msgText: string;
  word: string;
  handled?: boolean;
  memo?: string;
}

/* ---------- 요청(쓰기) 본문 ---------- */
export interface LoginRequest {
  loginId: string;
  password: string;
}
/** 백엔드 POST /auth/signup 본문 */
export interface SignupRequest {
  role: "STUDENT" | "TEACHER";
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  birthDate: string;
  phone: string;
  email: string;
  school?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  guardian?: {
    name: string;
    relation: "PARENT" | "RELATIVE" | "FACILITY" | "OTHER";
    contact: string;
  };
}
export interface GuardianConsentRequest {
  uid: string;
  name: string;
  relation: string;
  contact: string;
}
export interface NoteRequest {
  topic: string;
  body: string;
  /** 시나리오 연습에서 이어서 쓰는 쪽지면 그 연습 번호(이음쌤 화면의 "연결된 시나리오"가 돼요) */
  practiceId?: number;
}
export interface PublishMaterialsRequest {
  tab: string;
  area: string;
  level: number;
  items: unknown[];
}
