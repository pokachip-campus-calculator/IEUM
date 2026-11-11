// [역할] 홈 오른쪽 위 카드에서 돌아가며 보여 주는 위로 문구·격언·사례 목록.
// [동작] kind로 종류를 나눈다. comfort 위로 문구 / proverb 격언(고전) / story 공개된 유명인 이야기.
// [연결] ComfortRotator 컴포넌트가 읽는다. image는 나중에 직접 넣는 그림 경로(없으면 글만 보인다).
// [주의] 점수·비교·압박 표현을 쓰지 않는다. proverb·story는 출처가 확인된 것만 쓰고 from에 적는다.
//        사진은 실존 인물의 얼굴을 닮게 만들지 않는다(초상권·퍼블리시티권). 상징 그림이나 글만 쓴다.

export type ComfortItem = {
  kind: "comfort" | "proverb" | "story";
  text: string;
  /** 출처(이름·책·연도). 위로 문구는 없어도 된다 */
  from?: string;
  /** 나중에 넣는 그림 경로 */
  image?: string;
  /** 그림이 있으면 꼭 적는 설명(화면 읽기 프로그램용) */
  imageAlt?: string;
};

export const COMFORT_ITEMS: ComfortItem[] = [
  // ───── 위로 문구 (20, 직접 쓴 문구) ─────
  { kind: "comfort", text: "오늘도 나의 속도로 해도 괜찮아요." },
  { kind: "comfort", text: "쉬고 싶으면 언제든 쉬어도 돼요." },
  { kind: "comfort", text: "정해진 답은 없어요. 내가 편한 방법이면 충분해요." },
  { kind: "comfort", text: "여기까지 온 것만으로도 충분히 잘하고 있어요." },
  { kind: "comfort", text: "마음이 복잡한 날도 있어요. 그래도 괜찮아요." },
  { kind: "comfort", text: "천천히 해도 돼요. 서두르지 않아도 괜찮아요." },
  { kind: "comfort", text: "말하고 싶은 때, 말하고 싶은 만큼만 해도 돼요." },
  { kind: "comfort", text: "틀리는 것도, 헷갈리는 것도 연습의 일부예요." },
  { kind: "comfort", text: "오늘의 기분은 오늘의 기분일 뿐이에요." },
  { kind: "comfort", text: "혼자 다 해내지 않아도 돼요. 이음쌤이 곁에 있어요." },
  { kind: "comfort", text: "작은 한 걸음도 소중해요." },
  { kind: "comfort", text: "잠깐 숨 한 번 크게 쉬어 볼까요?" },
  { kind: "comfort", text: "내 마음을 알아차리는 것도 용기예요." },
  { kind: "comfort", text: "불편한 마음이 들면, 그 느낌을 믿어도 돼요." },
  { kind: "comfort", text: "도움을 청하는 건 약한 게 아니에요." },
  { kind: "comfort", text: "지금 이 순간만 생각해도 괜찮아요." },
  { kind: "comfort", text: "좋은 날도, 흐린 날도 모두 나의 하루예요." },
  { kind: "comfort", text: "비교하지 않아도 돼요. 나는 나의 속도로 가요." },
  { kind: "comfort", text: "오늘 여기에 와 줘서 고마워요." },
  { kind: "comfort", text: "말하지 않아도 괜찮아요. 준비되면 그때 해요." },

  // ───── 격언 (책 이름이 있는 고전, 저작권 만료) ─────
  { kind: "proverb", text: "천 리 길도 한 걸음부터예요. 오늘은 한 걸음이면 충분해요.", from: "노자 『도덕경』 64장" },
  { kind: "proverb", text: "배우고 익히는 일은 그 자체로 즐거울 수 있어요.", from: "공자 『논어』 학이편" },
  { kind: "proverb", text: "모르는 건 모른다고 말해도 괜찮아요. 그것도 아는 것의 하나예요.", from: "공자 『논어』 위정편" },

  // ───── 사례 (원문이 알려진 공개된 유명인, 숫자 없이 요약) ─────
  { kind: "story", text: "작가 J.K. 롤링은 졸업식 연설에서, 실패 없이 사는 건 불가능하고 실패를 겪으며 정말 중요한 게 뭔지 알게 됐다고 말했어요.", from: "J.K. 롤링, 하버드 졸업식 연설(2008)" },
  { kind: "story", text: "농구 선수 마이클 조던은 한 광고에서, 수없이 슛을 놓치고 여러 경기에서 졌다고 직접 이야기했어요. 놓치는 날도 과정의 일부예요.", from: "나이키 광고(1997)" },
  { kind: "story", text: "물리학자 아인슈타인은 자신에게 특별한 재능은 없고 호기심이 많을 뿐이라고 편지에 썼어요. 궁금해하는 마음이면 충분해요.", from: "아인슈타인의 편지(1952)" },
];
