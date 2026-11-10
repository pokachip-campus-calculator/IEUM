/**
 * 목업 데이터 — 내 학습 기록(S10)
 * 백엔드가 준비되면 이 파일 대신 services 가 실제 API 응답을 돌려줍니다.
 * (원본 디자인 화면에 들어 있던 샘플 데이터를 그대로 옮겼어요.)
 */
import type { LearningRecord } from "../types";

export const learningRecords: LearningRecord[] = [
  {
    id: "r5",
    d: 1030,
    date: "10월 30일",
    area: "safe",
    lv: 1,
    st: "doing",
    title: "안전·자기 보호",
    rows: [],
  },
  {
    id: "r1",
    d: 1031,
    date: "10월 31일",
    area: "safe",
    lv: 0,
    st: "done",
    title: "도움 구하기",
    rows: [
      ["어른에게 말하기", "아니에요", "그래요"],
      ["어디에 연락할까", "모르겠어요", "1388"],
    ],
  },
  {
    id: "r2",
    d: 1029,
    date: "10월 29일",
    area: "safe",
    lv: 0,
    st: "done",
    title: "안전·자기 보호",
    memo: "불편하면 멈춰도 된다는 걸 기억할래요.",
    rows: [
      ["사진 부탁", "보낸다", "멈춘다"],
      ["혼자 만나자는 말", "어른에게 이야기", "어른에게 이야기"],
      ["싫다고 말하기", "보통이에요", "그래요"],
    ],
  },
  {
    id: "r3",
    d: 1027,
    date: "10월 27일",
    area: "mind",
    lv: 1,
    st: "done",
    title: "감정 읽기",
    rows: [
      ["마음 짐작하기", "걱정", "걱정, 외로움"],
      ["단서 고르기", "표정", "표정, 몸짓"],
    ],
  },
  {
    id: "r4",
    d: 1026,
    date: "10월 26일",
    area: "mind",
    lv: 0,
    st: "done",
    title: "감정 읽기",
    rows: [
      ["마음 짐작하기", "서운함", "서운함"],
      ["단서 고르기", "표정", "표정, 목소리"],
    ],
  },
];
