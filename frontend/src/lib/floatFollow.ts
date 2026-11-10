/**
 * 사이드 메뉴 칸을 스크롤에 맞춰 '따라오게' 하는 플로팅 효과.
 *
 *  - 본문(.ie-body-row)이 스크롤되면 메뉴 칸이 그 위치를 부드럽게 뒤따라와요(감속하며 따라붙음).
 *  - 움직이는 동안은 그림자가 깊어져서 떠 있는 느낌이 나요(.is-moving).
 *  - 본문 영역 바닥을 넘지 않게 범위를 제한해요.
 *  - 움직임 줄이기 설정이거나 폭이 768px 미만(아래쪽 탭 바는 position:fixed 라 transform 과 같이 못 써요)이면
 *    꺼져서 예전처럼 화면에 딱 붙은(sticky) 상태로 돌아가요.
 *  - 학습자·이음쌤 사이드 메뉴가 같이 써요.
 */
export function startFloatFollow(slot: HTMLElement): () => void {
  const scroller = slot.closest(".ie-body-row") as HTMLElement | null;
  if (!scroller || typeof window === "undefined" || !window.matchMedia) return () => {};
  const main = scroller.querySelector(":scope > .ie-main") as HTMLElement | null;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 768px)");

  const MARGIN = 14; // 칸 위아래 바깥 여백(CSS 의 margin-block 과 같아야 해요)
  const EASE = 9; // 클수록 빨리 따라와요
  let cur = 0;
  let target = 0;
  let maxShift = 0;
  let raf = 0;
  let last = 0;
  let on = false;

  const isOn = () => !reduce.matches && wide.matches && getComputedStyle(slot).display !== "none";

  const reset = () => {
    slot.classList.remove("is-floating", "is-moving");
    slot.style.transform = "";
    cur = 0;
  };

  // 칸이 내려갈 수 있는 최대 거리: 본문 아래끝 - 칸 아래끝
  const measure = () => {
    if (!main) {
      maxShift = 0;
      return;
    }
    const areaBottom = main.offsetTop + main.offsetHeight;
    const slotBottom = slot.offsetTop + slot.offsetHeight;
    maxShift = Math.max(0, areaBottom - slotBottom - MARGIN);
  };

  const clampTarget = () => {
    target = Math.min(Math.max(scroller.scrollTop, 0), maxShift);
  };

  const apply = () => {
    slot.style.transform = `translate3d(0, ${cur.toFixed(2)}px, 0)`;
  };

  const tick = (t: number) => {
    raf = 0;
    if (!on) return;
    const dt = Math.min(0.1, last ? (t - last) / 1000 : 0.016);
    last = t;
    cur += (target - cur) * (1 - Math.exp(-dt * EASE));
    const diff = target - cur;
    if (Math.abs(diff) < 0.15) {
      cur = target;
      apply();
      slot.classList.remove("is-moving");
      last = 0;
      return;
    }
    slot.classList.add("is-moving");
    apply();
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (on && !raf) raf = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    clampTarget();
    wake();
  };

  const refresh = () => {
    const next = isOn();
    if (next !== on) {
      on = next;
      if (on) slot.classList.add("is-floating");
      else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        reset();
      }
    }
    if (on) {
      measure();
      clampTarget();
      wake();
    }
  };

  scroller.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refresh);
  reduce.addEventListener?.("change", refresh);
  wide.addEventListener?.("change", refresh);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refresh) : null;
  if (ro && main) ro.observe(main);
  refresh();
  // 처음 그릴 때 이미 스크롤돼 있으면(새로고침 등) 애니메이션 없이 바로 그 자리에서 시작해요
  if (on) {
    cur = target;
    apply();
  }

  return () => {
    scroller.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", refresh);
    reduce.removeEventListener?.("change", refresh);
    wide.removeEventListener?.("change", refresh);
    if (ro) ro.disconnect();
    if (raf) cancelAnimationFrame(raf);
    reset();
  };
}
