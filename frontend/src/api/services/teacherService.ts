import { USE_MOCK, http } from "../client";
import type { PublishMaterialsRequest, SignalStudent, Student, TeacherMessage } from "../types";
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

interface ApiThread {
  id: number;
  topic: string;
  status: "WAITING" | "ANSWERED";
  lastMessageAt: string;
  preview: string;
  student: { id: number; nickname: string };
  linkedPractice: { title: string } | null;
  hasSignal: boolean;
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

function mapStudent(student: ApiStudent, threads: Awaited<ReturnType<typeof getThreadDetails>>): Student {
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
    stamps: [],
    unit: "",
    rows: [],
    clues: [],
    guess: [],
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
    return studentResponse.items.map((student) => mapStudent(student, threads));
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
  /** POST /threads/{id}/messages */
  async sendReply(threadOrStudentId: string, text: string): Promise<void> {
    if (USE_MOCK) return;
    const response = await http<{ items: ApiThread[] }>("GET", "/teacher/threads");
    const targetId = Number(threadOrStudentId);
    const thread =
      response.items.find((item) => item.id === targetId) ??
      response.items.find(
        (item) => item.student.id === targetId && item.status === "WAITING",
      ) ??
      response.items.find((item) => item.student.id === targetId);
    if (!thread) throw new Error("답장을 보낼 대기 중인 쪽지를 찾을 수 없습니다.");
    await http("POST", `/threads/${thread.id}/messages`, { body: text });
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
  /** No teacher materials endpoint is currently provided by the backend. */
  async publishMaterials(_req: PublishMaterialsRequest): Promise<void> {
    if (USE_MOCK) return;
    throw new Error("강의 자료 게시 API는 아직 제공되지 않습니다.");
  },
};
