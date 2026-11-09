/**
 * S06 학습 영역
 * (원본 디자인: Areas.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import { css } from "@/lib/css";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import Gem from "@/components/Gem/Gem";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Areas.css?inline";

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
    const TAG: any = {
      "타인의 감정 읽기": ["마음", "ie-tag ie-tag--emotion"],
      "인간관계와 단체생활": ["관계", "ie-tag ie-tag--topic"],
      "범죄 예방과 연루": ["안전", "ie-tag ie-tag--safety"],
      "재난·응급·교통": ["안전", "ie-tag ie-tag--safety"],
    };
    const LV = ["오팔", "아쿠아마린", "자수정", "사파이어", "다이아몬드"];
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
    const DATA: any = this.props.practices;
    const s = this.state;
    const LET: any = [
      { id: "help", name: "마음", tag: "마음" },
      { id: "safe", name: "안전", tag: "안전" },
      { id: "emo", name: "관계", tag: "관계" },
    ];
    const IMG: any = {
      safe: [img.letterSafeBack, img.letterSafeFlap, img.letterSafeSeal],
      help: [img.letterHelpBack, img.letterHelpFlap, img.letterHelpSeal],
      emo: [img.letterEmoBack, img.letterEmoFlap, img.letterEmoSeal],
    };
    const q = (s.query || "").trim();
    const list = DATA.filter(
      (d) =>
        (s.area === "all" || d[2] === s.area) &&
        (s.topic === "all" || d[3] === s.topic) &&
        (s.tag === "all" || d[6] === s.tag) &&
        (q === "" || d[0].indexOf(q) !== -1 || d[1].indexOf(q) !== -1),
    );
    const chips = (opts, key) =>
      opts.map((o) => ({
        label: o[1],
        on: s[key] === o[0],
        pick: () => this.upd({ [key]: o[0] }),
      }));
    const ORDER = ["마음", "관계", "안전"];
    const TKEY: any = { 마음: "help", 관계: "emo", 안전: "safe" };
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
    };
    const sorted = list
      .slice()
      .sort((a, b) => ORDER.indexOf(a[6]) - ORDER.indexOf(b[6]) || a[3] - b[3]);
    const items = sorted.map((d, i) => {
      const total = DATA.filter((x) => x[6] === d[6]).length;
      const done = DATA.filter((x) => x[6] === d[6] && x[4] === "done").length;
      const L = LANE[d[6]];
      const K = TKEY[d[6]];
      return {
        laneStart: i === 0 || sorted[i - 1][6] !== d[6],
        laneName: L[0],
        laneDesc: L[1],
        laneGem: L[2],
        laneCls: L[3],
        laneIsSafe: K === "safe",
        laneIsHelp: K === "help",
        laneIsEmo: K === "emo",
        laneDone: done,
        laneTotal: total,
        lanePct: Math.round((done / total) * 100),
        laneAria: L[0] + " " + total + "개 중 " + done + "개 했어요",
        idx: i,
        title: d[0],
        desc: d[1],
        areaLabel: d[6],
        areaCls: TAGCLS[d[6]],
        topicLabel: "LEVEL " + (d[3] + 1) + " · " + LV[d[3]],
        minText: "10분 안팎",
        cardCls: "ie-card ie-pcard ie-pcard--" + K,
        gem: ["opal", "aqua", "ame", "sap", "dia"][d[3]],
        stLabel: ST[d[4]][0],
        stCls: ST[d[4]][1],
        cta: ST[d[4]][2],
        ctaCls: ST[d[4]][3],
        hasCta: ST[d[4]][4],
        href: d[5] || (d[3] > 0 ? ROUTES.unitVideo : ROUTES.unit),
      };
    });
    return {
      query: s.query,
      onQuery: (e) => this.upd({ query: e.target.value }),
      area: s.area,
      flip: s.flip,
      stageSel: "all",
      letters: LET.map((L) => {
        const open = s.sel === L.id;
        const B: any = {
          help: [12.0, 37.0, 17.9, 45.9, 47.7, "#E9876B"],
          safe: [36.3, 39.7, 18.7, 43.2, 54.9, "#4FB896"],
          emo: [62.1, 35.3, 17.5, 47.6, 55.3, "#8C79DC"],
        }[L.id];
        const D: any = {
          help: {
            env: "left:-4.286%;top:2.022%;width:105.07%;height:78.528%;--th:8deg;--dx:26.822cqw;--dy:-1.55cqw;--s:1.226;--hy:10.689%;--tri:polygon(8.27% 9.264%,92.037% 9.264%,51.072% 51.188%);--bk:#FFD1C8;--cl:15.176%;--ct:37.824%;--cw:69.954%;--ch:95.772%;--rise:73.333%;--cb:10.926%",
            body: img.envHelpBody,
            flap: img.envHelpFlap,
            int: img.envHelpInner,
          },
          safe: {
            env: "left:-4.826%;top:-14.209%;width:107.66%;height:96.913%;--th:-4.5deg;--dx:2.001cqw;--dy:-1.062cqw;--s:1.155;--hy:8.793%;--tri:polygon(9.299% 7.566%,92.561% 7.566%,50.572% 53.272%);--bk:#D0F8ED;--cl:16.252%;--ct:37.022%;--cw:69.356%;--ch:99.632%;--rise:73.333%;--cb:9.407%",
            body: img.envSafeBody,
            flap: img.envSafeFlap,
            int: img.envSafeInner,
          },
          emo: {
            env: "left:-6.273%;top:-4.192%;width:109.776%;height:87.415%;--th:-8deg;--dx:-23.15cqw;--dy:-0.931cqw;--s:1.224;--hy:8.23%;--tri:polygon(10.045% 6.996%,92.204% 6.996%,50.6% 52.778%);--bk:#DFCCFF;--cl:16.822%;--ct:36.634%;--cw:68.606%;--ch:100.247%;--rise:73.333%;--cb:9.465%",
            body: img.envEmoBody,
            flap: img.envEmoFlap,
            int: img.envEmoInner,
          },
        }[L.id];
        const cnt = DATA.filter((x) => x[6] === L.tag).length;
        return {
          id: L.id,
          name: L.name,
          on: open,
          px: B[4],
          cnt: cnt,
          cls: "ie-pst-hit ie-pst--" + L.id + (open ? " is-on" : ""),
          box:
            "left:" +
            B[0] +
            "%;top:" +
            B[1] +
            "%;width:" +
            B[2] +
            "%;height:" +
            B[3] +
            "%;--c:" +
            B[5],
          env: D.env,
          imgBody: D.body,
          imgFlap: D.flap,
          imgInt: D.int,
          aria: L.name + " 편지, 연습 " + cnt + "개, " + (open ? "열려 있어요" : "닫혀 있어요"),
          pick: () => this.upd({ sel: open ? null : L.id, tag: open ? "all" : L.tag }),
        };
      }),
      stageCls: "ie-pst ie-in" + (s.sel ? " has-open" : ""),
      tagChips: [["all", "전체"]].concat(TAGS.map((t) => [t, t])).map((o) => {
        const li = LET.map((L) => L.tag).indexOf(o[0]);
        const on = s.tag === o[0];
        return {
          label: o[1],
          on,
          pick: () =>
            this.upd(
              o[0] === "all" || on
                ? { tag: "all", sel: null }
                : li >= 0
                  ? { tag: o[0], sel: LET[li].id, cur: li }
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
                    src={img.stageBg}
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                  <div className="ie-pst-sw" role="radiogroup" aria-label="오늘 도착한 편지">
                    {(v.letters || []).map((l: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          role="radio"
                          className={l.cls}
                          style={css(l.box)}
                          aria-checked={l.on}
                          aria-label={l.aria}
                          onClick={l.pick}
                        >
                          <span className="ie-env" style={css(l.env)} aria-hidden="true">
                            <img
                              className="ie-env-i ie-env-int"
                              src={l.imgInt}
                              alt=""
                              draggable="false"
                            />
                            <span className="ie-env-cw">
                              <span className="ie-env-card">
                                <span className="ie-env-tt">
                                  {l.name}
                                  {" 편지"}
                                </span>
                                <span className="ie-env-ts">
                                  {"연습 "}
                                  {l.cnt}개
                                </span>
                              </span>
                            </span>
                            <img
                              className="ie-env-i ie-env-body"
                              src={l.imgBody}
                              alt=""
                              draggable="false"
                            />
                            <span className="ie-env-fl">
                              <span className="ie-env-flap">
                                <img
                                  className="ie-env-i ie-env-ff"
                                  src={l.imgFlap}
                                  alt=""
                                  draggable="false"
                                />
                                <span className="ie-env-fb" />
                              </span>
                            </span>
                          </span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="ie-pst-head">
                  <span className="ie-pst-eyebrow">
                    <span aria-hidden="true">✦</span>
                    {" 오늘도 도착한 편지"}
                  </span>
                  <h2 className="ie-pst-title" id="stg-h">
                    어디로 갈까요?
                  </h2>
                  <p className="ie-pst-desc">
                    끌리는 편지를 눌러 열어 보세요. 순서도 잠금도 없어요.
                  </p>
                </div>
                <p className="ie-pst-hint">
                  <span aria-hidden="true">✦</span>
                  {" 편지를 누르면 아래 연습 목록이 그 영역으로 바뀌어요."}
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
