/**
 * 목업 데이터 — 신호 대응 기록(T03)
 * 백엔드가 준비되면 이 파일 대신 services 가 실제 API 응답을 돌려줍니다.
 * (원본 디자인 화면에 들어 있던 샘플 데이터를 그대로 옮겼어요.)
 */
import type { SignalStudent } from "../types";

export const signalStudents: SignalStudent[] = [
  {
    id: "p2",
    nick: "바다",
    since: "10월 29일",
    seen: "10월 29일",
    msgDate: "10월 29일",
    msgText: "요즘은 집에 가기 싫어서 밖에서 오래 있어요.",
    word: "집에 가기 싫다",
  },
  {
    id: "p6",
    nick: "별빛",
    since: "10월 30일",
    seen: "10월 30일",
    msgDate: "10월 30일",
    msgText: "어떻게 말해야 할지 몰라서 쪽지를 써요. 친구들이 계속 셔틀을 시켜요.",
    word: "셔틀",
  },
];
