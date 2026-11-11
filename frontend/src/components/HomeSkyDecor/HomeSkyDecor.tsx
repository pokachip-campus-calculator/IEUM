// [역할] 홈 하늘에 별똥별·반짝임·작은 구슬을 장식으로 그린다(홈 전용, 기능 없음).
// [동작] 모두 CSS로만 그리고 천천히 반짝인다. 클릭·드래그를 막지 않는다.
// [연결] 홈 페이지의 큰 박스(position: relative) 안에 한 줄로 넣는다.
// [주의] aria-hidden. prefers-reduced-motion이면 움직임을 멈춘다. 1100px 이하에서는 구슬을 숨긴다.
import "./HomeSkyDecor.css";

const SPARKLES = [
  { top: "6%", left: "44%", size: 14, delay: 0 },
  { top: "18%", left: "58%", size: 10, delay: 1.2 },
  { top: "9%", left: "76%", size: 16, delay: 2.1 },
  { top: "30%", left: "88%", size: 10, delay: 0.6 },
  { top: "48%", left: "37%", size: 12, delay: 1.8 },
  { top: "6%", left: "93%", size: 12, delay: 2.6 },
  { top: "62%", left: "8%", size: 12, delay: 0.9 },
  { top: "78%", left: "70%", size: 10, delay: 1.5 },
];

export default function HomeSkyDecor() {
  return (
    <div className="home-sky-decor" aria-hidden="true">
      <span className="home-sky-comet" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="home-sky-sparkle"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
      <span className="home-sky-orb home-sky-orb--pink" />
      <span className="home-sky-orb home-sky-orb--gold" />
    </div>
  );
}
