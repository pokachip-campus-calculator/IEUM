// [역할] 홈 큰 박스의 오른쪽 위 빈 하늘에 위로 문구를 10초마다 한 줄씩 돌려 보여 준다(홈 전용).
// [동작] 불러올 때 문구 순서를 섞어 시작한다(새로고침하면 다른 문구가 먼저 나온다). 한 바퀴 돌면 다시 처음부터 돈다.
//        마우스를 올리거나 키보드로 선택하면 멈추고, 벗어나면 다시 돈다.
// [연결] data/comfortMessages.ts. 부모 컨테이너가 position: relative여야 오른쪽 위에 놓인다.
// [주의] 움직임은 prefers-reduced-motion을 따른다. 1100px 이하 화면에서는 마을과 겹치지 않게 숨긴다.
import { useEffect, useState } from "react";
import { COMFORT_ITEMS } from "../../data/comfortMessages";
import "./ComfortRotator.css";

const INTERVAL_MS = 10000;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ComfortRotator() {
  const [order] = useState(() => shuffle(COMFORT_ITEMS));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % order.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, order.length]);

  const item = order[index];

  return (
    <div
      className="comfort-rotator"
      role="note"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="comfort-rotator-cloud comfort-rotator-cloud--a" aria-hidden="true" />
      <span className="comfort-rotator-cloud comfort-rotator-cloud--b" aria-hidden="true" />
      <span className="comfort-rotator-cloud comfort-rotator-cloud--c" aria-hidden="true" />
      {item.image && (
        <img className="comfort-rotator-image" src={item.image} alt={item.imageAlt ?? ""} />
      )}
      <p key={index} className="comfort-rotator-text">
        {item.text}
        {item.from && <span className="comfort-rotator-from"> — {item.from}</span>}
      </p>
    </div>
  );
}
