import { ROUTES } from "@/routes";
import type { PracticeType } from "@/api";

const LEVEL_KEYS = ["opal", "aqua", "ame", "sap", "dia"];

/**
 * 연습 종류에 맞는 화면 주소. 학습 영역·학습 기록이 같은 규칙을 써요.
 *  - 감정 읽기 → /emotion, 시나리오 → /scenario, 학습 단위 → /unit (2단계 이상은 영상 /unit/video)
 *  - restart 가 true 면 서버 기록을 처음부터 다시 시작하고 열어요(주소의 restart=1 은 로더가 지워요).
 */
export function practiceHref(p: { id: number; type: PracticeType; levelIndex: number }, restart = false): string {
  const q = new URLSearchParams();
  const tail = () => {
    q.set("practiceId", String(p.id));
    if (restart) q.set("restart", "1");
    return "?" + q.toString();
  };
  if (p.type === "EMOTION") return ROUTES.emotion + tail();
  if (p.type === "SCENARIO") return ROUTES.scenario + tail();
  const idx = Math.max(0, Math.min(LEVEL_KEYS.length - 1, p.levelIndex));
  q.set("level", LEVEL_KEYS[idx]);
  return (idx > 0 ? ROUTES.unitVideo : ROUTES.unit) + tail();
}
