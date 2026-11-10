/**
 * S06 학습 영역
 * (원본 디자인: Areas.dc.html)
 */
import { Component, Fragment } from "react";
import type { PracticeItem } from "@/api";
import { A } from "@/lib/A";
import { practiceHref } from "@/lib/practiceLink";
import { css } from "@/lib/css";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import Gem from "@/components/Gem/Gem";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Areas.css?inline";

/** 이름표 앞의 작은 그림(마음·관계·안전·생활·자립). 색은 이름표 글자색을 따라가요. */
function GemIcon({ kind }: { kind: string }) {
  const common = { className: "ie-pst-ic", width: 22, height: 22, viewBox: "0 0 256 256", "aria-hidden": true } as const;
  if (kind === "heart")
    return (
      <svg {...common}>
        <path d="M128 216S28 160 28 92a52 52 0 0 1 100-20 52 52 0 0 1 100 20c0 68-100 124-100 124Z" fill="currentColor" />
      </svg>
    );
  if (kind === "people")
    return (
      <svg {...common}>
        <circle cx="96" cy="92" r="38" fill="currentColor" />
        <path d="M20 216a76 76 0 0 1 152 0Z" fill="currentColor" />
        <circle cx="190" cy="104" r="28" fill="currentColor" opacity=".7" />
        <path d="M188 160a62 62 0 0 1 56 56h-56Z" fill="currentColor" opacity=".7" />
      </svg>
    );
  if (kind === "shield")
    return (
      <svg {...common}>
        <path d="M128 20 36 54v64c0 58 40 96 92 118 52-22 92-60 92-118V54Z" fill="currentColor" />
        <path d="M92 124l26 26 48-52" fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "house")
    return (
      <svg {...common}>
        <path d="M24 124 128 36l104 88-12 14-20-17v95h-60v-62H116v62H56v-95l-20 17Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="18" />
      <path d="m176 80-28 68-68 28 28-68Z" fill="currentColor" />
    </svg>
  );
}

export default class Areas extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { area: "all", topic: "all", tag: "all", query: "", flip: 0, cur: 1, sel: null };
  }
  upd(p) {
    this.setState(Object.assign({}, p, { flip: 1 - this.state.flip }));
  }
  renderVals() {
    const TAGCLS: any = {
      마음: "ie-tag ie-tag--help",
      관계: "ie-tag ie-tag--emotion",
      안전: "ie-tag ie-tag--safety",
      생활: "ie-tag ie-tag--topic",
      자립: "ie-tag ie-tag--topic",
    };
    const TAGS = ["마음", "관계", "안전", "생활", "자립"];
    const LV = ["오팔", "아쿠아마린", "자수정", "사파이어", "다이아몬드"];
    const LEVEL_KEYS = ["opal", "aqua", "ame", "sap", "dia"];
    const ST: any = {
      done: ["했어요", "ie-status ie-status--done", "다시 해 보기", "ie-btn ie-btn--outline", true],
      doing: [
        "하는 중",
        "ie-status ie-status--doing",
        "이어서 하기",
        "ie-btn ie-btn--primary",
        true,
      ],
      next: [
        "아직 안 했어요",
        "ie-status ie-status--new",
        "시작하기",
        "ie-btn ie-btn--secondary",
        true,
      ],
    };
    const DATA = (this.props.practices || []) as PracticeItem[];
    const AREA_GROUP = {
      SAFETY: { key: "safe", tag: "안전" },
      HELP: { key: "emo", tag: "관계" },
      EMOTION: { key: "help", tag: "마음" },
      RELATION: { key: "emo", tag: "관계" },
      MIND: { key: "help", tag: "마음" },
      LIFE: { key: "life", tag: "생활" },
      INDEPENDENCE: { key: "indep", tag: "자립" },
    } as const;
    const STATUS_KEY = { NONE: "next", IN_PROGRESS: "doing", DONE: "done" } as const;
    const normalized = DATA.map((practice) => ({
      ...practice,
      areaKey: AREA_GROUP[practice.area].key,
      tag: AREA_GROUP[practice.area].tag,
      levelIndex: Math.max(0, Math.min(LV.length - 1, practice.level - 1)),
      statusKey: STATUS_KEY[practice.myStatus],
    }));
    const s = this.state;
    // 그림(1672x941) 위에서 보석 5개가 놓인 자리(px). 이름표는 그림에 박히지 않고 실제 글자로 올려요.
    const IMG_W = 1672;
    const IMG_H = 941;
    const HIT_TOP = 292; // 눌리는 칸의 위쪽
    const HIT_H = 395; // 눌리는 칸의 높이(이름표까지)
    const GEM_BOTTOM = 608; // 보석+구름 받침의 아래쪽
    const STAGE: any = [
      { id: "help", tag: "마음", name: "마음", icon: "heart", x: 40, w: 351, pill: 233, ink: "#D9487A", bg: "#FFE4EE", ring: "#F58DB0" },
      { id: "emo", tag: "관계", name: "관계", icon: "people", x: 400, w: 296, pill: 542, ink: "#2C8C73", bg: "#DAF6EC", ring: "#6DD3B5" },
      { id: "safe", tag: "안전", name: "안전", icon: "shield", x: 705, w: 286, pill: 843, ink: "#3568C8", bg: "#DDEBFF", ring: "#7FAEF2" },
      { id: "life", tag: "생활", name: "생활", icon: "house", x: 1005, w: 291, pill: 1144, ink: "#B8700B", bg: "#FFEDC8", ring: "#F2BE5A" },
      { id: "indep", tag: "자립", name: "자립", icon: "compass", x: 1315, w: 309, pill: 1454, ink: "#6A4BC9", bg: "#E8E0FF", ring: "#A592EE" },
    ];
    const q = (s.query || "").trim().toLocaleLowerCase();
    const list = normalized.filter(
      (practice) =>
        (s.area === "all" || practice.areaKey === s.area) &&
        (s.topic === "all" || practice.levelIndex === s.topic) &&
        (s.tag === "all" || practice.tag === s.tag) &&
        (q === "" ||
          practice.title.toLocaleLowerCase().includes(q) ||
          practice.summary.toLocaleLowerCase().includes(q)),
    );
    const chips = (opts, key) =>
      opts.map((o) => ({
        label: o[1],
        on: s[key] === o[0],
        pick: () => this.upd({ [key]: o[0] }),
      }));
    const ORDER = ["마음", "관계", "안전", "생활", "자립"];
    const TKEY: any = { 마음: "help", 관계: "emo", 안전: "safe", 생활: "help", 자립: "emo" };
    const LANE: any = {
      마음: [
        "마음",
        "나와 다른 사람의 마음을 알아차리고 짐작해 보는 연습",
        "opal",
        "ie-lane ie-lane--help",
      ],
      관계: [
        "관계",
        "친구와 단체생활 속에서 내 마음을 말로 전해 보는 연습",
        "ame",
        "ie-lane ie-lane--emo",
      ],
      안전: [
        "안전",
        "불편한 상황을 알아차리고 내 경계를 지키며 도움을 구하는 연습",
        "aqua",
        "ie-lane ie-lane--safe",
      ],
      생활: ["생활", "일상에서 필요한 상황을 살펴보고 연습해요", "ame", "ie-lane ie-lane--help"],
      자립: ["자립", "나에게 필요한 일을 스스로 해 보는 연습", "sap", "ie-lane ie-lane--emo"],
    };
    const sorted = list
      .slice()
      .sort((a, b) => ORDER.indexOf(a.tag) - ORDER.indexOf(b.tag) || a.levelIndex - b.levelIndex);
    const items = sorted.map((practice, i) => {
      const total = normalized.filter((item) => item.tag === practice.tag).length;
      const done = normalized.filter((item) => item.tag === practice.tag && item.myStatus === "DONE").length;
      const L = LANE[practice.tag];
      const K = TKEY[practice.tag];
      const href = practiceHref(practice);
      return {
        laneStart: i === 0 || sorted[i - 1].tag !== practice.tag,
        laneName: L[0],
        laneDesc: L[1],
        laneGem: L[2],
        laneCls: L[3],
        laneIsSafe: practice.tag === "안전",
        laneIsHelp: practice.tag === "마음",
        laneIsEmo: practice.tag === "관계",
        laneDone: done,
        laneTotal: total,
        lanePct: Math.round((done / total) * 100),
        laneAria: L[0] + " " + total + "개 중 " + done + "개 했어요",
        idx: i,
        title: practice.title,
        desc: practice.summary,
        areaLabel: practice.tag,
        areaCls: TAGCLS[practice.tag],
        topicLabel: "LEVEL " + practice.level + " · " + LV[practice.levelIndex],
        minText: `${practice.estMinutes}분 안팎`,
        cardCls: "ie-card ie-pcard ie-pcard--" + K,
        gem: LEVEL_KEYS[practice.levelIndex],
        stLabel: ST[practice.statusKey][0],
        stCls: ST[practice.statusKey][1],
        cta: ST[practice.statusKey][2],
        ctaCls: ST[practice.statusKey][3],
        hasCta: ST[practice.statusKey][4],
        href,
      };
    });
    return {
      query: s.query,
      onQuery: (e) => this.upd({ query: e.target.value }),
      area: s.area,
      flip: s.flip,
      stageSel: "all",
      letters: STAGE.map((L) => {
        const open = s.sel === L.id;
        const gemH = GEM_BOTTOM - HIT_TOP; // 보석과 구름 받침이 들어가는 높이(px)
        return {
          id: L.id,
          name: L.name,
          icon: L.icon,
          on: open,
          cls: "ie-pst-hit ie-pst--" + L.id + (open ? " is-on" : ""),
          // 눌리는 칸: 그림 위의 위치를 퍼센트로 둬서 화면이 줄어도 그림과 같이 움직여요.
          boxStyle: {
            left: (L.x / IMG_W) * 100 + "%",
            top: (HIT_TOP / IMG_H) * 100 + "%",
            width: (L.w / IMG_W) * 100 + "%",
            height: (HIT_H / IMG_H) * 100 + "%",
            "--c": L.ring,
            "--ink": L.ink,
            "--pill": L.bg,
          },
          // 보석 부분만 같은 그림에서 오려 낸 층. 올리거나 눌렀을 때 이 층만 움직여요.
          gemStyle: {
            height: (gemH / HIT_H) * 100 + "%",
            backgroundImage: `url(${img.stageGems})`,
            backgroundSize: `${(IMG_W / L.w) * 100}% ${(IMG_H / gemH) * 100}%`,
            backgroundPosition: `${(L.x / (IMG_W - L.w)) * 100}% ${(HIT_TOP / (IMG_H - gemH)) * 100}%`,
          },
          pillStyle: { left: ((L.pill - L.x) / L.w) * 100 + "%" },
          aria: L.name + ", " + (open ? "선택했어요" : "선택하지 않았어요"),
          // 같은 걸 다시 누르면 풀고, 다른 걸 누르면 그쪽으로 바꿔요.
          pick: () =>
            this.upd(open ? { sel: null, tag: "all" } : { sel: L.id, tag: L.tag }),
        };
      }),
      stageCls: "ie-pst ie-in" + (s.sel ? " has-open" : ""),
      tagChips: [["all", "전체"]].concat(TAGS.map((t) => [t, t])).map((o) => {
        const li = STAGE.map((L) => L.tag).indexOf(o[0]);
        const on = s.tag === o[0];
        return {
          label: o[1],
          on,
          pick: () =>
            this.upd(
              o[0] === "all" || on
                ? { tag: "all", sel: null }
                : li >= 0
                  ? { tag: o[0], sel: STAGE[li].id, cur: li }
                  : { tag: o[0], sel: null },
            ),
        };
      }),
      topicChips: chips(
        [
          ["all", "전체"],
          [0, "오팔"],
          [1, "아쿠아마린"],
          [2, "자수정"],
          [3, "사파이어"],
          [4, "다이아몬드"],
        ],
        "topic",
      ),
      items,
      hasItems: items.length > 0,
      noItems: items.length === 0,
      countText: "연습 " + items.length + "개",
      filtered: s.area !== "all" || s.topic !== "all" || s.tag !== "all" || q !== "",
      reset: () => this.upd({ area: "all", topic: "all", tag: "all", query: "", sel: null }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="areas" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <SideNav active="areas" />
            </div>
            <main className="ie-main">
              <section className="ie-banner ie-banner--lav ie-in" aria-labelledby="ar-h">
                <span
                  className="ie-orb"
                  style={{ width: "120px", height: "120px", left: "44%", top: "-44px" }}
                />
                <div className="ie-banner-text ie-banner-text--wide">
                  <h1 id="ar-h" className="ie-title">
                    학습 영역
                  </h1>
                  <p className="ie-body-lg ie-sub">
                    마음이 가는 연습부터 골라요. 단계는 잠기지 않았고, 순서도 정해져 있지 않아요.
                  </p>
                  <div className="ie-field ie-phead-search">
                    <label className="ie-label" htmlFor="q">
                      연습 찾기
                    </label>
                    <div className="ie-search">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M192,112a80,80,0,1,1-80-80A80,80,0,0,1,192,112Z" fill="#DCE3F5" />
                        <path
                          d="M229.66,218.34,179.6,168.28a88.21,88.21,0,1,0-11.32,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                          fill="#5F6981"
                        />
                      </svg>
                      <input
                        id="q"
                        className="ie-input"
                        type="search"
                        placeholder="예: 단톡방, 선물, 친구"
                        value={v.query}
                        onChange={v.onQuery}
                        aria-describedby="q-help"
                      />
                    </div>
                  </div>
                </div>
                <div className="ie-banner-art ie-fade-l">
                  <img className="ie-3img" src={img.bannerAreas} alt="" draggable="false" />
                </div>
              </section>
              <section
                className={v.stageCls}
                style={{ "--d": "1" } as CSSProperties}
                aria-labelledby="stg-h"
              >
                <div className="ie-pst-art">
                  <img
                    className="ie-pst-bg"
                    src={img.stageGems}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                  <div className="ie-pst-sw" role="radiogroup" aria-label="배움 영역 고르기">
                    {(v.letters || []).map((l: any) => (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        className={l.cls}
                        style={l.boxStyle}
                        aria-checked={l.on}
                        aria-label={l.aria}
                        onClick={l.pick}
                      >
                        <span className="ie-gem" style={l.gemStyle} aria-hidden="true" />
                        <span className="ie-pst-pill" style={l.pillStyle}>
                          <GemIcon kind={l.icon} />
                          <span className="ie-pst-name">{l.name}</span>
                          <svg
                            className="ie-pst-ck"
                            width="14"
                            height="14"
                            viewBox="0 0 256 256"
                            aria-hidden="true"
                          >
                            <path
                              d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ie-pst-head">
                  <h2 className="ie-pst-title" id="stg-h">
                    나만의 배움을 찾아볼까요?
                  </h2>
                  <p className="ie-pst-desc">다섯 가지 배움 속에서 오늘의 주제를 골라요</p>
                </div>
                <p className="ie-pst-hint">
                  <span aria-hidden="true">✦</span>
                  {" 배움을 누르면 아래 연습 목록이 그 영역으로 바뀌어요."}
                </p>
              </section>
              <section
                className="ie-fbar ie-in"
                style={{ "--d": "1" } as CSSProperties}
                aria-label="연습 필터"
              >
                <div className="ie-fgroup" role="radiogroup" aria-labelledby="tag-l">
                  <span className="ie-flab" id="tag-l">
                    대분류
                  </span>{" "}
                  {(v.tagChips || []).map((c: any, __i0: number) => (
                    <Fragment key={__i0}>
                      <button
                        type="button"
                        role="radio"
                        className="ie-chip"
                        aria-checked={c.on}
                        onClick={c.pick}
                      >
                        <span className="ie-chip-check">
                          <svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true">
                            <path
                              d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        {c.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <div className="ie-fgroup" role="radiogroup" aria-labelledby="topic-l">
                  <span className="ie-flab" id="topic-l">
                    난이도 단계
                  </span>{" "}
                  {(v.topicChips || []).map((c: any, __i0: number) => (
                    <Fragment key={__i0}>
                      <button
                        type="button"
                        role="radio"
                        className="ie-chip"
                        aria-checked={c.on}
                        onClick={c.pick}
                      >
                        <span className="ie-chip-check">
                          <svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true">
                            <path
                              d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        {c.label}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </section>
              <div className="ie-row-between">
                <p className="ie-body ie-strong" aria-live="polite">
                  {v.countText}
                </p>
                {v.filtered ? (
                  <button type="button" className="ie-btn ie-btn--text" onClick={v.reset}>
                    필터 모두 풀기
                  </button>
                ) : null}
              </div>
              {v.hasItems ? (
                <ul className="ie-lanes" id="ar-list" data-k={v.flip}>
                  {(v.items || []).map((it: any, __i0: number) => (
                    <Fragment key={__i0}>
                      {it.laneStart ? (
                        <li className={it.laneCls} style={css(`--i:${it.idx}`)}>
                          <span className="ie-lane-gem">
                            {it.laneIsSafe ? (
                              <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
                                <path
                                  d="M32 8 L52 15 V32 C52 44 43 53 32 57 C21 53 12 44 12 32 V15 Z"
                                  fill="#BFE5D4"
                                />
                                <path
                                  d="M23 32 L30 39 L42 25"
                                  fill="none"
                                  stroke="#2A6A52"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                            {it.laneIsHelp ? (
                              <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
                                <path
                                  d="M32 54 C10 39 8 23 18 16.5 C25 12.5 30 16 32 21 C34 16 39 12.5 46 16.5 C56 23 54 39 32 54Z"
                                  fill="#FFD2BD"
                                  stroke="#94431F"
                                  strokeWidth="3.5"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                            {it.laneIsEmo ? (
                              <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
                                <path
                                  d="M12 14 H52 a6 6 0 0 1 6 6 V38 a6 6 0 0 1 -6 6 H30 L18 54 V44 H12 a6 6 0 0 1 -6 -6 V20 a6 6 0 0 1 6 -6 Z"
                                  fill="#D6CCFB"
                                />
                                <circle cx="22" cy="29" r="3.4" fill="#4E3FA6" />
                                <circle cx="32" cy="29" r="3.4" fill="#4E3FA6" />
                                <circle cx="42" cy="29" r="3.4" fill="#4E3FA6" />
                              </svg>
                            ) : null}
                          </span>
                          <div className="ie-lane-text">
                            <h2 className="ie-h2">{it.laneName}</h2>
                            <p className="ie-body ie-sub">{it.laneDesc}</p>
                          </div>
                          <div className="ie-lane-prog" role="img" aria-label={it.laneAria}>
                            <span className="ie-ring" style={css(`--p:${it.lanePct}`)}>
                              <b>
                                {it.laneDone}/{it.laneTotal}
                              </b>
                            </span>
                            <span className="ie-meta">했어요</span>
                          </div>
                        </li>
                      ) : null}
                      <li className={it.cardCls} style={css(`gap: 12px;--i:${it.idx}`)}>
                        <span className="ie-pcard-gem">
                          <Gem kind={it.gem} size="34" />
                        </span>
                        <div className="ie-row" style={{ paddingRight: "56px" }}>
                          <span className={it.areaCls}>{it.areaLabel}</span>
                          <span className="ie-tag ie-tag--topic">{it.topicLabel}</span>
                        </div>
                        <h3 className="ie-h3">{it.title}</h3>
                        <p className="ie-body ie-sub" style={{ flex: "1" }}>
                          {it.desc}
                        </p>
                        <div className="ie-row-between">
                          <span className="ie-meta">{it.minText}</span>
                          <span className={it.stCls}>{it.stLabel}</span>
                        </div>
                        {it.hasCta ? (
                          <A className={it.ctaCls} href={it.href}>
                            {it.cta}
                          </A>
                        ) : null}
                      </li>
                    </Fragment>
                  ))}
                </ul>
              ) : null}{" "}
              {v.noItems ? (
                <div className="ie-empty" role="status">
                  <Gem kind="opal" size="48" /> <b className="ie-h3">찾는 연습이 아직 없어요</b>
                  <p className="ie-body ie-sub">다른 낱말로 찾아보거나 필터를 풀어 보세요.</p>
                  <button type="button" className="ie-btn ie-btn--secondary" onClick={v.reset}>
                    필터 모두 풀기
                  </button>
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </>
    );
  }
}
