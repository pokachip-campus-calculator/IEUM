import { USE_MOCK, http } from "../client";
import type { PublishMaterialsRequest, SignalStudent, Student, TeacherMessage } from "../types";
import * as signals from "../mock/signals";
import * as students from "../mock/students";
import * as teacherMessages from "../mock/teacherMessages";

/** 이음쌤 구역 */
export const teacherService = {
  /** GET /teacher/students */
  async getStudents(): Promise<Student[]> {
    if (USE_MOCK) return students.students;
    return http("GET", "/teacher/students");
  },
  /** GET /teacher/messages */
  async getMessages(): Promise<TeacherMessage[]> {
    if (USE_MOCK) return teacherMessages.teacherMessages;
    return http("GET", "/teacher/messages");
  },
  /** GET /teacher/signals */
  async getSignalStudents(): Promise<SignalStudent[]> {
    if (USE_MOCK) return signals.signalStudents;
    return http("GET", "/teacher/signals");
  },
  /** POST /teacher/students/:id/replies */
  async sendReply(studentId: string, text: string): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", `/teacher/students/${encodeURIComponent(studentId)}/replies`, { text });
  },
  /** PUT /teacher/students/:id/memo */
  async saveMemo(studentId: string, memo: string): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", `/teacher/students/${encodeURIComponent(studentId)}/memo`, { memo });
  },
  /** PUT /teacher/signals/:id */
  async saveSignalRecord(studentId: string, req: { done: boolean[]; memo: string }): Promise<void> {
    if (USE_MOCK) return;
    return http("PUT", `/teacher/signals/${encodeURIComponent(studentId)}`, req);
  },
  /** POST /teacher/materials — 강의 자료 올리기(게시) */
  async publishMaterials(req: PublishMaterialsRequest): Promise<void> {
    if (USE_MOCK) return;
    return http("POST", "/teacher/materials", req);
  },
};
