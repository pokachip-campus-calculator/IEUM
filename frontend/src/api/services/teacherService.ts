import { USE_MOCK, http } from "../client";
import type {
  CompareRow,
  PublishMaterialsRequest,
  SignalStudent,
  Student,
  TeacherMessage,
  TeacherSummary,
} from "../types";
import * as signals from "../mock/signals";
import * as students from "../mock/students";
import * as teacherMessages from "../mock/teacherMessages";

interface ApiStudent {
  id: number;
  nickname: string;
  assignedAt: string;
  lastActivityAt: string | null;
  doneCount: number;
  waitingThreadCount: number;
  hasOpenSignal: boolean;
}

/** GET /teacher/students/{id} — 학습자가 마친 연습과 비교·감정 읽기 결과(점수·메모는 없어요) */
interface ApiStudentDetail {
  id: number;
  records: {
    practiceId: number;
    title: string;
    type: "UNIT" | "SCENARIO" | "EMOTION";
    level: number;
    completedAt: string;
    compare: { text: string; then: string; now: string }[] | null;
    emotion: { clues: string[]; feelings: string[] } | null;
  }[];
}

interface ApiThread {
  id: number;
  topic: string;
  status: "WAITING" | "ANSWERED";
  lastMessageAt: string;
  preview: string;
  student: { id: number; nickname: string };
  linkedPractice: { title: string } | null;
  hasSignal: boolean;
  signalStatus?: "OPEN" | "HANDLED" | null;
}

interface ApiThreadDetail {
  id: number;
  status: "WAITING" | "ANSWERED";
  createdAt: string;
  student: { id: number; nickname: string };
  linkedPractice: { title: string; pickedChoice?: string } | null;
  messages: { senderRole: "STUDENT" | "TEACHER"; body: string; createdAt: string }[];
}

interface ApiSignal {
  id: number;
  status: "OPEN" | "HANDLED";
  matchedText: string;
  responseMemo: string | null;
  student: { id: number; nickname: string; assignedAt: string };
  message: { threadId: number; body: string; createdAt: string };
  createdAt: string;
}

const topicLabels: Record<string, string> = {
  FRIEND: "친구 관계",
  ONLINE: "온라인에서 생긴 비밀 부탁",
  SCHOOL: "학교생활",
  HOME: "집과 일상",
  ETC: "그 밖의 이야기",
};

function monthDay(value: string): string {
  const [, month, day] = value.slice(0, 10).split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function dayKey(value: string): number {
  const [, month, day] = value.slice(0, 10).split("-").map(Number);
  return month * 100 + day;
}

function timeLabel(value: string, role: "STUDENT" | "TEACHER"): string {
  const [, time] = value.split("T");
  const [hour, minute] = time.split(":");
  return `${monthDay(value)} · ${role === "STUDENT" ? "받은 쪽지" : "내가 보낸 답장"} ${hour}:${minute}`;
}

async function getThreadDetails(): Promise<{ summary: ApiThread; detail: ApiThreadDetail }[]> {
  const response = await http<{ items: ApiThread[] }>("GET", "/teacher/threads");
  return Promise.all(
    response.items.map(async (summary) => ({
      summary,
      detail: await http<ApiThreadDetail>("GET", `/threads/${summary.id}`),
    })),
  );
}

function mapStudent(
  student: ApiStudent,
  threads: Awaited<ReturnType<typeof getThreadDetails>>,
  detail: ApiStudentDetail | null,
): Student {
  // 상세의 기록은 마친 날짜 최신순이에요. 비교는 가장 최근 학습 단위, 감정 읽기는 가장 최근 것을 보여 줘요.
  const records = detail?.records ?? [];
  const unitRec = records.find((r) => r.type === "UNIT" && r.compare && r.compare.length > 0);
  const emoRec = records.find((r) => r.type === "EMOTION" && r.emotion);
  const rows: CompareRow[] = (unitRec?.compare ?? []).map((c) => [c.text, c.then, c.now]);
  const ownThreads = threads.filter(({ summary }) => summary.student.id === student.id);
  const notes = ownThreads.flatMap(({ summary, detail }) =>
    detail.messages.map((message) => ({
      from: message.senderRole === "STUDENT" ? ("l" as const) : ("t" as const),
      date: monthDay(message.createdAt),
      sc: summary.linkedPractice?.title ?? "",
      text: message.body,
    })),
  );
  const activity = student.lastActivityAt ?? student.assignedAt;

  return {
    id: String(student.id),
    nick: student.nickname,
    how: student.hasOpenSignal ? "확인이 필요한 신호로 배정" : "쪽지 신청",
    sig: student.hasOpenSignal,
    last: monthDay(activity),
    key: dayKey(activity),
    since: monthDay(student.assignedAt),
    stamps: records.map((r) => [r.title, monthDay(r.completedAt)] as [string, string]),
    unit: unitRec ? `${unitRec.title} · LEVEL ${unitRec.level}` : "",
    rows,
    clues: emoRec?.emotion?.clues ?? [],
    guess: emoRec?.emotion?.feelings ?? [],
    notes,
  };
}

function mapTeacherMessage(
  thread: { summary: ApiThread; detail: ApiThreadDetail },
): TeacherMessage {
  const { summary, detail } = thread;
  return {
    id: String(summary.id),
    nick: summary.student.nickname,
    date: monthDay(summary.lastMessageAt),
    sig: summary.hasSignal,
    // 신호가 있는데 상태가 안 내려오면(옛 응답) 확인이 필요한 쪽으로 보여 줘요.
    sigStatus: summary.hasSignal ? (summary.signalStatus ?? "OPEN") : null,
    scenario: summary.linkedPractice?.title ?? topicLabels[summary.topic] ?? summary.topic,
    picked: detail.linkedPractice?.pickedChoice
      ? `고른 것: ${detail.linkedPractice.pickedChoice}`
      : "",
    need: summary.status === "WAITING",
    thread: detail.messages.map((message) => [
      message.senderRole === "STUDENT" ? "l" : "t",
      timeLabel(message.createdAt, message.senderRole),
      message.body,
    ]),
  };
}

/** 이음쌤 구역 */
export const teacherService = {
  /** GET /teacher/students, /teacher/threads, and GET /threads/{id} */
  async getStudents(): Promise<Student[]> {
    if (USE_MOCK) return students.students;
    // 학생 목록(/teacher/students)은 실구현이지만 쪽지 목록(/teacher/threads)은 #51 전까지 목이라,
    // 쪽지를 못 불러와도 학생 목록은 보이게 합니다.
    const [studentResponse, threads] = await Promise.all([
      http<{ items: ApiStudent[] }>("GET", "/teacher/students"),
      getThreadDetails().catch(() => [] as Awaited<ReturnType<typeof getThreadDetails>>),
    ]);
    // 학생마다 상세(마친 연습·비교·감정 읽기)를 함께 읽어요. 읽기 전용이고, 하나가 실패해도 목록은 보여요.
    const details = await Promise.all(
      studentResponse.items.map((student) =>
        http<ApiStudentDetail>("GET", `/teacher/students/${student.id}`).catch(() => null),
      ),
    );
    return studentResponse.items.map((student, i) => mapStudent(student, threads, details[i]));
  },
  /** GET /teacher/summary — 이음쌤 홈 위쪽 숫자(담당 학습자 수 · 대기 쪽지 수 · 확인이 필요한 신호 수) */
  async getSummary(): Promise<TeacherSummary | null> {
    if (USE_MOCK) return null;
    try {
      return await http<TeacherSummary>("GET", "/teacher/summary");
    } catch {
      return null; // 요약을 못 받아도 목록으로 계산해 보여 줘요
    }
  },
  /** GET /teacher/threads and GET /threads/{id} */
  async getMessages(): Promise<TeacherMessage[]> {
    if (USE_MOCK) return teacherMessages.teacherMessages;
    return (await getThreadDetails()).map(mapTeacherMessage);
  },
  /** GET /teacher/signals */
  async getSignalStudents(): Promise<SignalStudent[]> {
    if (USE_MOCK) return signals.signalStudents;
    const response = await http<{ items: ApiSignal[] }>("GET", "/teacher/signals");
    return response.items.map((signal) => ({
      id: String(signal.id),
      nick: signal.student.nickname,
      since: monthDay(signal.student.assignedAt),
      seen: monthDay(signal.createdAt),
      msgDate: monthDay(signal.message.createdAt),
      msgText: signal.message.body,
      word: signal.matchedText,
      handled: signal.status === "HANDLED",
      memo: signal.responseMemo ?? "",
    }));
  },
  /**
   * POST /threads/{id}/messages — 서버가 쪽지를 ANSWERED(답장했어요)로 바꿔요.
   * 화면이 목록을 다시 받지 않아도 되도록, 보낸 답장 정보를 돌려줘요(목업이면 null).
   */
  async sendReply(
    threadOrStudentId: string,
    text: string,
  ): Promise<{ threadId: string; entry: [string, string, string] } | null> {
    if (USE_MOCK) return null;
    const response = await http<{ items: ApiThread[] }>("GET", "/teacher/threads");
    const targetId = Number(threadOrStudentId);
    const thread =
      response.items.find((item) => item.id === targetId) ??
      response.items.find(
        (item) => item.student.id === targetId && item.status === "WAITING",
      ) ??
      response.items.find((item) => item.student.id === targetId);
    if (!thread) throw new Error("답장을 보낼 대기 중인 쪽지를 찾을 수 없습니다.");
    const sent = await http<{ body: string; createdAt: string }>(
      "POST",
      `/threads/${thread.id}/messages`,
      { body: text },
    );
    return {
      threadId: String(thread.id),
      entry: ["t", timeLabel(sent.createdAt, "TEACHER"), sent.body],
    };
  },
  /** No teacher student-memo endpoint is currently provided by the backend. */
  async saveMemo(_studentId: string, _memo: string): Promise<void> {
    if (USE_MOCK) return;
    throw new Error("학습자 대응 메모 저장 API는 아직 제공되지 않습니다.");
  },
  /** PATCH /teacher/signals/{id} */
  async saveSignalRecord(signalId: string, req: { done: boolean[]; memo: string }): Promise<void> {
    if (USE_MOCK) return;
    await http("PATCH", `/teacher/signals/${encodeURIComponent(signalId)}`, {
      handled: req.done.length > 0 && req.done.every(Boolean),
      memo: req.memo,
    });
  },
  /** POST /teacher/students/{studentId}/transfer-requests — 내 담당 학습자를 다른 이음쌤에게 이관 신청(25). */
  async requestTransfer(studentId: string, toLoginId: string): Promise<void> {
    if (USE_MOCK) return;
    await http("POST", `/teacher/students/${encodeURIComponent(studentId)}/transfer-requests`, {
      toLoginId: toLoginId.trim(),
    });
  },
  /** POST /teacher/transfer-requests/{id}/accept — 받는 이음쌤이 이관을 수락(26). */
  async acceptTransfer(transferId: number): Promise<void> {
    if (USE_MOCK) return;
    await http("POST", `/teacher/transfer-requests/${transferId}/accept`);
  },
  /** No teacher materials endpoint is currently provided by the backend. */
  async publishMaterials(_req: PublishMaterialsRequest): Promise<void> {
    if (USE_MOCK) return;
    throw new Error("강의 자료 게시 API는 아직 제공되지 않습니다.");
  },
};
