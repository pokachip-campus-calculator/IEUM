/**
 * 목업 데이터 — 쪽지 모아 보기(T02)
 * 백엔드가 준비되면 이 파일 대신 services 가 실제 API 응답을 돌려줍니다.
 * (원본 디자인 화면에 들어 있던 샘플 데이터를 그대로 옮겼어요.)
 */
import type { TeacherMessage } from "../types";

export const teacherMessages: TeacherMessage[] = [
  {
    id: "t2",
    nick: "바다",
    date: "10월 29일",
    sig: true,
    sigStatus: "OPEN",
    scenario: "온라인에서 받은 비밀 부탁",
    picked: "고른 것: 비밀 부탁에 대해 “멈춘다”를 골랐어요.",
    need: true,
    thread: [
      ["l", "10월 29일 · 받은 쪽지", "이 상황이 내 일 같아요. 어떻게 말해야 할지 모르겠어요."],
    ],
  },
  {
    id: "t1",
    nick: "구름",
    date: "10월 28일",
    sig: false,
    scenario: "단톡방에서 받은 곤란한 부탁",
    picked: "고른 것: 부탁에 대해 “어른에게 이야기”를 골랐어요.",
    need: true,
    thread: [["l", "10월 28일 · 받은 쪽지", "단톡방에서 저만 빼고 이야기하는 것 같아요."]],
  },
  {
    id: "t4",
    nick: "노을",
    date: "10월 31일",
    sig: true,
    sigStatus: "HANDLED",
    scenario: "친구랑 다툰 뒤 말 걸기",
    picked: "고른 것: 짧은 인사로 시작하는 쪽을 골랐어요.",
    need: false,
    thread: [
      ["l", "10월 30일 · 받은 쪽지", "친구랑 다투고 나서 먼저 말을 못 걸겠어요."],
      [
        "t",
        "10월 31일 · 내가 보낸 답장",
        "이야기해 줘서 고마워요. 먼저 말 걸기가 어려운 건 자연스러워요. 짧은 인사부터 함께 생각해 볼까요?",
      ],
    ],
  },
];
