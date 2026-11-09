import { useLayoutEffect } from "react";

/**
 * 화면 하나에만 필요한 CSS 를 그 화면이 떠 있는 동안에만 <head> 에 넣어 줍니다.
 * (화면마다 같은 선택자를 다르게 덮어쓰는 규칙이 있어서, 다른 화면으로 새어 나가지 않게 하기 위함이에요.)
 */
export default function PageStyle({ css }: { css: string }) {
  useLayoutEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-page-style", "");
    el.textContent = css;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [css]);
  return null;
}
