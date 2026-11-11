// [역할] 홈 큰 박스의 오른쪽 위 빈 하늘에 위로 문구를 10초마다 한 줄씩 돌려 보여 준다(홈 전용).
// [동작] 불러올 때 문구 순서를 섞어 시작한다(새로고침하면 다른 문구가 먼저 나온다). 한 바퀴 돌면 다시 처음부터 돈다.
//        마우스를 올리거나 키보드로 선택하면 멈추고, 벗어나면 다시 돈다.
// [연결] data/comfortMessages.ts. 부모 컨테이너가 position: relative여야 오른쪽 위에 놓인다.
// [주의] 움직임은 prefers-reduced-motion을 따른다. 1100px 이하 화면에서는 마을과 겹치지 않게 숨긴다.
//        구름(.comfort-rotator-cloud)은 카드보다 먼저 그려야 카드 뒤로 깔린다(레이어 순서: 구름 → 유리 카드 → 글자).
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
    <div className="comfort-rotator-wrap">
      <svg
        className="comfort-rotator-cloud"
        viewBox="0 0 520 380"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="crCloudFill" cx="42%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#efe8ff" />
            <stop offset="100%" stopColor="#d8c9f2" />
          </radialGradient>
          <filter id="crCloudBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <g filter="url(#crCloudBlur)">
          <ellipse cx="70" cy="230" rx="78" ry="55" fill="url(#crCloudFill)" />
          <ellipse cx="45" cy="165" rx="48" ry="38" fill="url(#crCloudFill)" />
          <ellipse cx="450" cy="235" rx="82" ry="56" fill="url(#crCloudFill)" />
          <ellipse cx="478" cy="165" rx="46" ry="37" fill="url(#crCloudFill)" />
          <ellipse cx="260" cy="340" rx="200" ry="58" fill="url(#crCloudFill)" />
          <ellipse cx="150" cy="55" rx="62" ry="34" fill="url(#crCloudFill)" />
          <ellipse cx="365" cy="48" rx="58" ry="32" fill="url(#crCloudFill)" />
          <ellipse cx="110" cy="265" rx="34" ry="24" fill="#ffd3ea" opacity="0.4" />
          <ellipse cx="415" cy="270" rx="32" ry="22" fill="#ffd3ea" opacity="0.35" />
        </g>
        <g opacity="0.85">
          <ellipse cx="62" cy="200" rx="46" ry="30" fill="#ffffff" opacity="0.55" />
          <ellipse cx="462" cy="205" rx="48" ry="31" fill="#ffffff" opacity="0.5" />
        </g>
      </svg>
      <div
        className="comfort-rotator"
        role="note"
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {item.image && (
          <img className="comfort-rotator-image" src={item.image} alt={item.imageAlt ?? ""} />
        )}
        <p key={index} className="comfort-rotator-text">
          {item.text}
          {item.from && <span className="comfort-rotator-from"> — {item.from}</span>}
        </p>
      </div>
    </div>
  );
}
