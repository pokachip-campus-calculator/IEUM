/**
 * S07-2 학습 단위 (영상)
 * (원본 디자인: UnitVideo.dc.html)
 */
import { Component, Fragment } from "react";
import { recordService } from "@/api";
import { A } from "@/lib/A";
import { css } from "@/lib/css";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import Gem from "@/components/Gem/Gem";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./UnitVideo.css?inline";

export default class UnitVideo extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      phase: "learn",
      pre: { 0: 0, 1: 2, 2: 0, 3: 1, 4: 1, 5: 2, 6: 1, 7: 1 },
      post: {},
      v: 1,
      prog: [100, 38, 0],
      max: [100, 38, 0],
      playing: false,
      cap: true,
      text: false,
      rate: "1",
      paused: false,
      hint: "",
      apiError: "",
    };
  }
  componentDidMount() {
    this.timer = setInterval(() => this.tick(), 400);
  }
  componentWillUnmount() {
    clearInterval(this.timer);
  }
  tick() {
    const s = this.state;
    if (!s.playing || s.phase !== "learn" || s.paused) return;
    const i = s.v;
    const p = Math.min(100, s.prog[i] + 2 * Number(s.rate));
    const prog = s.prog.slice();
    prog[i] = p;
    const max = s.max.slice();
    max[i] = Math.max(max[i], p);
    this.setState({ prog, max, playing: p < 100 });
  }
  renderVals() {
    const s = this.state;

    const Q: any = this.props.questions;
    const V: any = this.props.videos;
    const LEVELS: any = {
      aqua: ["아쿠아마린", 2],
      ame: ["자수정", 3],
      sap: ["사파이어", 4],
      dia: ["다이아몬드", 5],
    };
    const lvKey = LEVELS[this.props.level] ? this.props.level : "aqua";
    const lv = LEVELS[lvKey];
    const fmt = (sec) => {
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
    };
    const labelOf = (q, x) =>
      x === undefined ? "답하지 않았어요" : q.t === "sit" ? q.opts[x] : q.opts[x][0];
    const mkQs = (key) =>
      Q.map((q, i) => ({
        no: i + 1,
        text: q.text,
        isSit: q.t === "sit",
        isFace: q.t === "face",
        opts: q.opts.map((o, j) => ({
          label: q.t === "sit" ? o : o[0],
          mouth: q.t === "face" ? o[1] : "",
          fill: q.t === "face" ? o[2] : "",
          on: s[key][i] === j,
          pick: () => this.setState({ [key]: Object.assign({}, s[key], { [i]: j }) }),
        })),
      }));
    const i = s.v;
    const v = V[i];
    const p = s.prog[i];
    const watched = s.max.map((m) => m >= 95);
    const allWatched = watched.every(Boolean);
    const now = Math.round((v.dur * p) / 100);
    const preN = Object.keys(s.pre).length;
    const postN = Object.keys(s.post).length;
    const phases = ["pre", "learn", "post", "compare", "done"];
    const labels = ["사전 질문지", "영상 학습", "사후 질문지", "비교", "마침"];
    const pi = phases.indexOf(s.phase);
    const cmp = Q.map((q, k) => {
      const a = s.pre[k],
        b = s.post[k];
      const has = a !== undefined && b !== undefined;
      const same = has && a === b;
      return {
        no: k + 1,
        text: q.text,
        then: labelOf(q, a),
        now: labelOf(q, b),
        badge: !has ? "비교할 답이 없어요" : same ? "같아요" : "달라졌어요",
        badgeCls: !has
          ? "ie-status ie-status--new"
          : same
            ? "ie-status ie-status--doing"
            : "ie-status ie-status--done",
        ctitle: q.t === "sit" ? "최고의 선택:" : "이렇게 생각해 볼 수 있어요:",
        best:
          q.t === "sit"
            ? q.opts[q.best]
            : "정답이 하나는 아니에요. 같은 상황에서도 사람마다 달라요.",
        reason: q.t === "sit" ? q.reason : q.fr,
      };
    });
    const stOf = (k) =>
      watched[k]
        ? ["봤어요", "ie-status ie-status--done"]
        : s.prog[k] > 0
          ? ["보는 중", "ie-status ie-status--doing"]
          : ["아직 안 봤어요", "ie-status ie-status--new"];
    const curSt = watched[i]
      ? ["이 영상을 끝까지 봤어요", "ie-status ie-status--done"]
      : ["끝까지 보면 다음으로 갈 수 있어요", "ie-status ie-status--new"];
    const capLine = v.lines[Math.min(2, Math.floor(p / 34))];
    const reset = {
      phase: "pre",
      pre: {},
      post: {},
      v: 0,
      prog: [0, 0, 0],
      max: [0, 0, 0],
      playing: false,
      hint: "",
    };
    return {
      gemKind: lvKey,
      levelText: lv[0] + " · LEVEL " + lv[1],
      steps: labels.map((l, k) => ({
        label: l,
        mark: k < pi ? "✓" : String(k + 1),
        cls: k < pi ? "ie-step is-done" : "ie-step",
        current: k === pi ? "step" : "false",
      })),
      paused: s.paused,
      pause: () => this.setState({ paused: true, playing: false }),
      resume: () => this.setState({ paused: false }),
      isLearn: s.phase === "learn" && !s.paused,
      notLearn: s.phase !== "learn" && !s.paused,
      isPre: s.phase === "pre",
      isPost: s.phase === "post",
      isCompare: s.phase === "compare",
      isDone: s.phase === "done",
      apiError: s.apiError,
      finishUnit: async () => {
        this.setState({ apiError: "" });
        try {
          await recordService.completeUnit({
            practiceId: this.props.practiceId,
            kind: "video",
            level: this.props.level,
            pre: s.pre,
            post: s.post,
          });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "학습 기록을 저장하지 못했어요.",
          });
        } finally {
          this.setState({ phase: "done" });
        }
      },
      preQs: mkQs("pre"),
      postQs: mkQs("post"),
      preBar: Math.round((preN / Q.length) * 100) + "%",
      postBar: Math.round((postN / Q.length) * 100) + "%",
      preCount: preN + " / " + Q.length + "문항에 답했어요",
      postCount: postN + " / " + Q.length + "문항에 답했어요",
      preBlocked: preN < Q.length,
      postBlocked: postN < Q.length,
      toLearn: () => {
        if (preN < Q.length) {
          this.setState({
            hint: "아직 고르지 않은 문항이 있어요. " + Q.length + "문항을 모두 골라 주세요.",
          });
          return;
        }
        this.setState({ phase: "learn", hint: "" });
      },
      toCompare: () => {
        if (postN < Q.length) {
          this.setState({
            hint: "아직 고르지 않은 문항이 있어요. " + Q.length + "문항을 모두 골라 주세요.",
          });
          return;
        }
        this.setState({ phase: "compare", hint: "" });
      },
      vNo: i + 1,
      cur: {
        title: v.title,
        l1: v.l1,
        l2: v.l2,
        lines: v.lines,
        durText: fmt(v.dur),
        a: i === 0,
        b: i === 1,
        c: i === 2,
      },
      isPlaying: s.playing,
      notPlaying: !s.playing,
      showBigPlay: !s.playing,
      playLabel: s.playing ? "멈춤" : p >= 100 ? "다시 보기" : p > 0 ? "이어서 보기" : "재생",
      toggle: () => {
        if (p >= 100) {
          const pr = s.prog.slice();
          pr[i] = 0;
          this.setState({ prog: pr, playing: true, hint: "" });
          return;
        }
        this.setState({ playing: !s.playing, hint: "" });
      },
      back10: () => {
        const pr = s.prog.slice();
        pr[i] = Math.max(0, p - 1000 / v.dur);
        this.setState({ prog: pr, hint: "" });
      },
      seekVal: Math.round(p),
      seekText: fmt(now) + " / " + fmt(v.dur),
      onSeek: (e) => {
        const val = Number(e.target.value);
        const to = Math.min(val, s.max[i]);
        const pr = s.prog.slice();
        pr[i] = to;
        this.setState({
          prog: pr,
          hint:
            val > s.max[i]
              ? "아직 보지 않은 곳으로는 건너뛸 수 없어요. 본 곳까지만 옮길 수 있어요."
              : "",
        });
      },
      timeNow: fmt(now),
      timeTotal: fmt(v.dur),
      capOn: s.cap,
      capLine,
      toggleCap: () => this.setState({ cap: !s.cap }),
      textOn: s.text,
      toggleText: () => this.setState({ text: !s.text }),
      rate: s.rate,
      onRate: (e) => this.setState({ rate: e.target.value }),
      curStLabel: curSt[0],
      curStCls: curSt[1],
      watchedCount: watched.filter(Boolean).length + "편 봤어요",
      playlist: V.map((x, k) => ({
        n: k + 1,
        title: x.title,
        meta: fmt(x.dur) + " · 자막 있어요",
        on: k === i,
        cur: k === i ? "step" : "false",
        stLabel: stOf(k)[0],
        stCls: stOf(k)[1],
        a: k === 0,
        b: k === 1,
        c: k === 2,
        go: () => this.setState({ v: k, playing: false, hint: "" }),
      })),
      notLast: i < 2,
      isLast: i === 2,
      prev: () => this.setState({ v: Math.max(0, i - 1), playing: false, hint: "" }),
      nextBlocked: !watched[i],
      finishBlocked: !allWatched,
      next: () => {
        if (!watched[i]) {
          this.setState({ hint: "영상을 끝까지 보면 다음으로 갈 수 있어요." });
          return;
        }
        this.setState({ v: i + 1, playing: false, hint: "" });
      },
      finish: () => {
        if (!allWatched) {
          this.setState({
            hint: "아직 끝까지 보지 않은 영상이 있어요. 오른쪽 목록에서 골라 이어 봐요.",
          });
          return;
        }
        this.setState({ phase: "post", playing: false, hint: "" });
      },
      showHint: s.hint !== "",
      hint: s.hint,
      cmp,
      again: () => this.setState(reset),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="unit" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <SideNav active="unit" />
            </div>
            <main className="ie-main">
              <section className="ie-banner ie-banner--mint ie-in" aria-labelledby="uv-h">
                <span
                  className="ie-orb"
                  style={{ width: "110px", height: "110px", left: "44%", top: "-40px" }}
                />
                <div className="ie-banner-text" style={{ maxWidth: "600px" }}>
                  <nav className="ie-crumb" aria-label="현재 위치">
                    <A href={ROUTES.areas}>학습 영역</A>
                    <span aria-hidden="true">›</span>
                    <span>학습 단위</span>
                  </nav>
                  <h1 id="uv-h" className="ie-title">
                    안전·자기 보호
                  </h1>
                  <div className="ie-row">
                    <span className="ie-tag ie-tag--safety">안전</span>
                    <span className="ie-tag">
                      <Gem kind={v.gemKind} size="20" />
                      {v.levelText}
                    </span>
                    <span className="ie-tag ie-tag--topic">영상으로 배워요</span>
                  </div>
                  <ol className="ie-steps" aria-label="학습 순서">
                    {(v.steps || []).map((st: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li className={st.cls} aria-current={st.current}>
                          <span className="ie-step-num">{st.mark}</span>
                          {st.label}
                        </li>
                      </Fragment>
                    ))}
                  </ol>
                  <div className="ie-banner-actions">
                    <button type="button" className="ie-btn ie-btn--outline" onClick={v.pause}>
                      <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#D9CFFF" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM112,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Z"
                          fill="#4E3FA6"
                        />
                      </svg>
                      잠시 쉬기
                    </button>
                  </div>
                </div>
                <div className="ie-banner-art ie-fade-l">
                  <img className="ie-3img" src={img.bannerUnit} alt="" draggable="false" />
                </div>
              </section>
              {v.paused ? (
                <section
                  className="ie-card ie-card--hero ie-card--lav"
                  role="status"
                  style={{ alignItems: "flex-start" }}
                >
                  <h2 className="ie-h2">잠시 쉬어요</h2>
                  <p className="ie-body-lg">보던 곳은 저장돼 있어요. 준비되면 이어서 하면 돼요.</p>
                  <div className="ie-row">
                    <button
                      type="button"
                      className="ie-btn ie-btn--primary ie-btn--lg"
                      onClick={v.resume}
                    >
                      이어서 하기
                    </button>
                    <A className="ie-btn ie-btn--outline ie-btn--lg" href={ROUTES.home}>
                      홈으로
                    </A>
                  </div>
                </section>
              ) : null}{" "}
              {v.isLearn ? (
                <div className="ie-layout">
                  <div className="ie-stack">
                    <section className="ie-card" aria-labelledby="uv-learn" style={{ gap: "16px" }}>
                      <div className="ie-row-between">
                        <h2 id="uv-learn" className="ie-h2">
                          2. 영상 학습
                        </h2>
                        <span className="ie-meta" aria-live="polite">
                          {"영상 "}
                          {v.vNo}
                          {" / 3"}
                        </span>
                      </div>
                      <div className="ie-media" style={{ aspectRatio: "16 / 9" }}>
                        <div
                          style={{
                            position: "absolute",
                            inset: "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "18px 0 70px",
                          }}
                          aria-hidden="true"
                        >
                          {v.cur.a ? (
                            <img className="ie-uimg" src={img.unitCard1} alt="" draggable="false" />
                          ) : null}{" "}
                          {v.cur.b ? (
                            <img className="ie-uimg" src={img.unitCard3} alt="" draggable="false" />
                          ) : null}{" "}
                          {v.cur.c ? (
                            <img className="ie-uimg" src={img.unitCard5} alt="" draggable="false" />
                          ) : null}
                        </div>
                        <span
                          className="ie-tag ie-tag--topic"
                          style={{ position: "absolute", left: "14px", top: "14px" }}
                        >
                          {"영상 "}
                          {v.vNo}
                          {" · "}
                          {v.cur.durText}
                        </span>{" "}
                        {v.showBigPlay ? (
                          <button
                            type="button"
                            className="ie-iconbtn"
                            aria-label={v.playLabel}
                            onClick={v.toggle}
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "42%",
                              transform: "translate(-50%,-50%)",
                              width: "76px",
                              height: "76px",
                              borderRadius: "50%",
                              border: "0",
                              background: "#FFFFFF",
                              boxShadow: "var(--ie-shadow-3)",
                            }}
                          >
                            <svg width="34" height="34" viewBox="0 0 256 256" aria-hidden="true">
                              <path
                                d="M90,56 L206,128 L90,200 Z"
                                fill="#5366AF"
                                stroke="#5366AF"
                                strokeWidth="20"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        ) : null}{" "}
                        {v.capOn ? (
                          <p
                            className="ie-body-lg"
                            style={{
                              position: "absolute",
                              left: "50%",
                              bottom: "14px",
                              transform: "translateX(-50%)",
                              width: "max-content",
                              maxWidth: "calc(100% - 32px)",
                              margin: "0",
                              padding: "8px 18px",
                              borderRadius: "14px",
                              background: "rgba(255,255,255,.95)",
                              color: "#28334C",
                              boxShadow: "var(--ie-shadow-1)",
                              textAlign: "center",
                              fontWeight: "500",
                            }}
                          >
                            {v.capLine}
                          </p>
                        ) : null}
                      </div>
                      <div
                        className="ie-card ie-card--flat"
                        style={{ gap: "12px", padding: "14px 16px" }}
                      >
                        <div className="ie-row" style={{ gap: "10px" }}>
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary"
                            onClick={v.toggle}
                          >
                            {v.isPlaying ? (
                              <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
                                <rect
                                  x="68"
                                  y="52"
                                  width="40"
                                  height="152"
                                  rx="10"
                                  fill="#FFFFFF"
                                />
                                <rect
                                  x="148"
                                  y="52"
                                  width="40"
                                  height="152"
                                  rx="10"
                                  fill="#FFFFFF"
                                />
                              </svg>
                            ) : null}
                            {v.notPlaying ? (
                              <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
                                <path
                                  d="M90,56 L206,128 L90,200 Z"
                                  fill="#FFFFFF"
                                  stroke="#FFFFFF"
                                  strokeWidth="20"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                            {v.playLabel}
                          </button>{" "}
                          <button
                            type="button"
                            className="ie-btn ie-btn--outline"
                            onClick={v.back10}
                          >
                            10초 뒤로
                          </button>{" "}
                          <span
                            className="ie-body ie-strong"
                            style={{ marginLeft: "auto" }}
                            aria-live="off"
                          >
                            {v.timeNow}
                            {" / "}
                            {v.timeTotal}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={v.seekVal}
                          onChange={v.onSeek}
                          aria-label="재생 위치"
                          aria-valuetext={v.seekText}
                          style={{ width: "100%", height: "44px", margin: "0" }}
                        />
                        <div className="ie-row" style={{ gap: "10px" }}>
                          <button
                            type="button"
                            className="ie-chip"
                            aria-pressed={v.capOn}
                            onClick={v.toggleCap}
                          >
                            <span className="ie-box" />
                            자막 보기
                          </button>{" "}
                          <button
                            type="button"
                            className="ie-chip"
                            aria-pressed={v.textOn}
                            onClick={v.toggleText}
                          >
                            <span className="ie-box" />
                            글로 읽기
                          </button>{" "}
                          <span className="ie-row" style={{ gap: "8px", marginLeft: "auto" }}>
                            <label className="ie-meta" htmlFor="uv-rate">
                              재생 속도
                            </label>{" "}
                            <select
                              id="uv-rate"
                              className="ie-select ie-select-inline"
                              value={v.rate}
                              onChange={v.onRate}
                            >
                              <option value="0.75">0.75배 천천히</option>
                              <option value="1">1배</option>
                              <option value="1.25">1.25배</option>
                            </select>
                          </span>
                        </div>
                        <p className="ie-help">
                          처음 보는 영상은 건너뛰지 않고 끝까지 봐요. 본 곳까지는 앞뒤로 옮길 수
                          있어요.
                        </p>
                      </div>
                      <div className="ie-learnpanel">
                        <span className="ie-eyebrow">
                          {"영상 "}
                          {v.vNo}
                          {" / 3 · 보기 전에"}
                        </span>
                        <h3 className="ie-h3">{v.cur.title}</h3>
                        <p className="ie-body-lg">{v.cur.l1}</p>
                        <p className="ie-body-lg">{v.cur.l2}</p>
                      </div>
                      {v.textOn ? (
                        <div className="ie-card ie-card--sky" style={{ gap: "10px" }}>
                          <h3 className="ie-h3">영상 내용을 글로 읽어요</h3>
                          <ol
                            className="ie-stack-s"
                            style={{ gap: "8px", listStyle: "decimal", paddingLeft: "22px" }}
                          >
                            {(v.cur.lines || []).map((ln: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <li className="ie-body-lg">{ln}</li>
                              </Fragment>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                      <hr className="ie-divider" />
                      <div className="ie-row-between">
                        <span className={v.curStCls} role="status">
                          {v.curStLabel}
                        </span>
                        <div className="ie-row">
                          <button type="button" className="ie-btn ie-btn--outline" onClick={v.prev}>
                            이전 영상
                          </button>{" "}
                          {v.notLast ? (
                            <button
                              type="button"
                              className="ie-btn ie-btn--primary"
                              aria-disabled={v.nextBlocked}
                              onClick={v.next}
                            >
                              다음 영상
                            </button>
                          ) : null}{" "}
                          {v.isLast ? (
                            <button
                              type="button"
                              className="ie-btn ie-btn--primary"
                              aria-disabled={v.finishBlocked}
                              onClick={v.finish}
                            >
                              학습 완료했어요
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {v.showHint ? (
                        <p className="ie-help" role="status">
                          {v.hint}
                        </p>
                      ) : null}
                    </section>
                  </div>
                  <aside className="ie-panel" aria-label="영상 안내">
                    <section className="ie-card" aria-labelledby="uv-list" style={{ gap: "12px" }}>
                      <div className="ie-row-between">
                        <h2 id="uv-list" className="ie-h3">
                          영상 목록
                        </h2>
                        <span className="ie-meta">{v.watchedCount}</span>
                      </div>
                      <ol className="ie-stack-s" style={{ gap: "10px" }}>
                        {(v.playlist || []).map((it: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <li>
                              <button
                                type="button"
                                className="ie-listrow"
                                aria-pressed={it.on}
                                aria-current={it.cur}
                                onClick={it.go}
                                style={{ flexDirection: "row", alignItems: "center", gap: "12px" }}
                              >
                                <span
                                  className="ie-media ie-media--img"
                                  style={{
                                    width: "96px",
                                    flex: "none",
                                    aspectRatio: "16 / 9",
                                    borderRadius: "12px",
                                    padding: "4px 0",
                                  }}
                                  aria-hidden="true"
                                >
                                  {it.a ? (
                                    <img
                                      className="ie-uimg"
                                      src={img.unitCard1}
                                      alt=""
                                      draggable="false"
                                    />
                                  ) : null}
                                  {it.b ? (
                                    <img
                                      className="ie-uimg"
                                      src={img.unitCard3}
                                      alt=""
                                      draggable="false"
                                    />
                                  ) : null}
                                  {it.c ? (
                                    <img
                                      className="ie-uimg"
                                      src={img.unitCard5}
                                      alt=""
                                      draggable="false"
                                    />
                                  ) : null}
                                </span>{" "}
                                <span
                                  className="ie-stack-s"
                                  style={{ gap: "4px", flex: "1 1 auto" }}
                                >
                                  <b className="ie-body ie-strong">
                                    {it.n}
                                    {". "}
                                    {it.title}
                                  </b>
                                  <span className="ie-meta">{it.meta}</span>
                                  <span className={it.stCls} style={{ alignSelf: "flex-start" }}>
                                    {it.stLabel}
                                  </span>
                                </span>
                              </button>
                            </li>
                          </Fragment>
                        ))}
                      </ol>
                    </section>
                    <section className="ie-card ie-card--lav">
                      <h2 className="ie-h3">영상으로 배울 때</h2>
                      <ul
                        className="ie-stack-s"
                        style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                      >
                        <li className="ie-body">소리를 켤 수 없으면 자막을 켜요.</li>
                        <li className="ie-body">글로 읽는 게 편하면 ‘글로 읽기’를 눌러요.</li>
                        <li className="ie-body">
                          어려우면 천천히 보거나 10초 뒤로 가서 다시 봐요.
                        </li>
                      </ul>
                    </section>
                    <div className="ie-alert ie-alert--warm" role="note">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#FFD6C1" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,216,128ZM144,176a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#94431F"
                        />
                      </svg>
                      <div>
                        <b>보다가 마음이 불편하면 멈춰도 괜찮아요.</b>{" "}
                        <A href={ROUTES.talk}>이음상담소</A>
                        에서 쪽지를 쓸 수 있어요.
                      </div>
                    </div>
                  </aside>
                </div>
              ) : null}{" "}
              {v.notLearn ? (
                <div className="ie-layout" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                  <div className="ie-stack">
                    {v.isPre ? (
                      <section className="ie-card" aria-labelledby="uv-pre" style={{ gap: "20px" }}>
                        <div className="ie-stack-s" style={{ gap: "6px" }}>
                          <h2 id="uv-pre" className="ie-h2">
                            1. 사전 질문지
                          </h2>
                          <p className="ie-body ie-sub">
                            정답을 찾는 게 아니에요. 지금 내 생각대로 골라요. 8문항을 모두 골라야
                            다음으로 갈 수 있어요. 잘 모르겠으면 ‘잘 모르겠어요’나 ‘보통이에요’를
                            골라도 돼요.
                          </p>
                        </div>
                        {(v.preQs || []).map((q: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <fieldset className="ie-qcard" style={{ margin: "0" }}>
                              <span className="ie-tile ie-tile--lav ie-strong" aria-hidden="true">
                                {q.no}
                              </span>
                              <div className="ie-stack-s" style={{ gap: "10px", minWidth: "0" }}>
                                <legend className="ie-body-lg ie-strong" style={{ padding: "0" }}>
                                  {q.text}
                                </legend>{" "}
                                {q.isSit ? (
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "8px" }}
                                    role="radiogroup"
                                    aria-label={q.text}
                                  >
                                    {(q.opts || []).map((o: any, __i1: number) => (
                                      <Fragment key={__i1}>
                                        <button
                                          type="button"
                                          role="radio"
                                          className="ie-option"
                                          aria-checked={o.on}
                                          onClick={o.pick}
                                        >
                                          <span className="ie-dot" />
                                          <span>{o.label}</span>
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}{" "}
                                {q.isFace ? (
                                  <div className="ie-faces" role="radiogroup" aria-label={q.text}>
                                    {(q.opts || []).map((o: any, __i1: number) => (
                                      <Fragment key={__i1}>
                                        <button
                                          type="button"
                                          role="radio"
                                          className="ie-face"
                                          aria-checked={o.on}
                                          onClick={o.pick}
                                        >
                                          <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 32 32"
                                            aria-hidden="true"
                                          >
                                            <circle cx="16" cy="16" r="14" fill={o.fill} />
                                            <circle cx="11.5" cy="13" r="1.6" fill="#28334C" />
                                            <circle cx="20.5" cy="13" r="1.6" fill="#28334C" />
                                            <path
                                              d={o.mouth}
                                              stroke="#28334C"
                                              strokeWidth="1.8"
                                              fill="none"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                          {o.label}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </fieldset>
                          </Fragment>
                        ))}
                        <div className="ie-qprog" role="status">
                          <div className="ie-bar" aria-hidden="true">
                            <span style={css(`width:${v.preBar}`)} />
                          </div>
                          <span className="ie-meta">{v.preCount}</span>
                        </div>
                        <div className="ie-row">
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary ie-btn--lg"
                            aria-disabled={v.preBlocked}
                            onClick={v.toLearn}
                          >
                            영상 보러 가기
                          </button>
                          <span className="ie-help" aria-live="polite">
                            {v.preCount}
                          </span>
                        </div>
                        {v.showHint ? (
                          <p className="ie-help" role="status">
                            {v.hint}
                          </p>
                        ) : null}
                      </section>
                    ) : null}{" "}
                    {v.isPost ? (
                      <section
                        className="ie-card"
                        aria-labelledby="uv-post"
                        style={{ gap: "20px" }}
                      >
                        <div className="ie-stack-s" style={{ gap: "6px" }}>
                          <h2 id="uv-post" className="ie-h2">
                            3. 사후 질문지
                          </h2>
                          <p className="ie-body ie-sub">
                            처음과 같은 질문이에요. 처음에 고른 답은 보이지 않아요. 지금 내 생각대로
                            8문항을 모두 골라요.
                          </p>
                        </div>
                        {(v.postQs || []).map((q: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <fieldset className="ie-qcard" style={{ margin: "0" }}>
                              <span className="ie-tile ie-tile--lav ie-strong" aria-hidden="true">
                                {q.no}
                              </span>
                              <div className="ie-stack-s" style={{ gap: "10px", minWidth: "0" }}>
                                <legend className="ie-body-lg ie-strong" style={{ padding: "0" }}>
                                  {q.text}
                                </legend>{" "}
                                {q.isSit ? (
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "8px" }}
                                    role="radiogroup"
                                    aria-label={q.text}
                                  >
                                    {(q.opts || []).map((o: any, __i1: number) => (
                                      <Fragment key={__i1}>
                                        <button
                                          type="button"
                                          role="radio"
                                          className="ie-option"
                                          aria-checked={o.on}
                                          onClick={o.pick}
                                        >
                                          <span className="ie-dot" />
                                          <span>{o.label}</span>
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}{" "}
                                {q.isFace ? (
                                  <div className="ie-faces" role="radiogroup" aria-label={q.text}>
                                    {(q.opts || []).map((o: any, __i1: number) => (
                                      <Fragment key={__i1}>
                                        <button
                                          type="button"
                                          role="radio"
                                          className="ie-face"
                                          aria-checked={o.on}
                                          onClick={o.pick}
                                        >
                                          <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 32 32"
                                            aria-hidden="true"
                                          >
                                            <circle cx="16" cy="16" r="14" fill={o.fill} />
                                            <circle cx="11.5" cy="13" r="1.6" fill="#28334C" />
                                            <circle cx="20.5" cy="13" r="1.6" fill="#28334C" />
                                            <path
                                              d={o.mouth}
                                              stroke="#28334C"
                                              strokeWidth="1.8"
                                              fill="none"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                          {o.label}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </fieldset>
                          </Fragment>
                        ))}
                        <div className="ie-qprog" role="status">
                          <div className="ie-bar" aria-hidden="true">
                            <span style={css(`width:${v.postBar}`)} />
                          </div>
                          <span className="ie-meta">{v.postCount}</span>
                        </div>
                        <div className="ie-row">
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary ie-btn--lg"
                            aria-disabled={v.postBlocked}
                            onClick={v.toCompare}
                          >
                            그때와 지금 비교하기
                          </button>
                          <span className="ie-help" aria-live="polite">
                            {v.postCount}
                          </span>
                        </div>
                        {v.showHint ? (
                          <p className="ie-help" role="status">
                            {v.hint}
                          </p>
                        ) : null}
                      </section>
                    ) : null}{" "}
                    {v.isCompare ? (
                      <>
                        <section
                          className="ie-card"
                          aria-labelledby="uv-cmp"
                          style={{ gap: "20px" }}
                        >
                          <div className="ie-stack-s" style={{ gap: "6px" }}>
                            <h2 id="uv-cmp" className="ie-h2">
                              4. 그때와 지금
                            </h2>
                            <p className="ie-body ie-sub">
                              점수는 없어요. 달라졌는지, 같은지만 보여 줘요. 같아도 괜찮아요.
                            </p>
                          </div>
                          {(v.cmp || []).map((c: any, __i0: number) => (
                            <Fragment key={__i0}>
                              <article
                                className="ie-stack-s"
                                style={{
                                  gap: "10px",
                                  paddingBottom: "16px",
                                  borderBottom: "1px solid #E6E8F6",
                                }}
                              >
                                <b className="ie-body-lg">
                                  {c.no}
                                  {". "}
                                  {c.text}
                                </b>
                                <div className="ie-cmp">
                                  <div className="ie-cmp-cell">
                                    <span className="ie-meta">그때</span>
                                    <br />
                                    <b>{c.then}</b>
                                  </div>
                                  <div className="ie-cmp-cell">
                                    <span className="ie-meta">지금</span>
                                    <br />
                                    <b>{c.now}</b>
                                  </div>
                                  <span className={c.badgeCls} style={{ alignSelf: "center" }}>
                                    {c.badge}
                                  </span>
                                </div>
                                <div className="ie-alert ie-alert--ok">
                                  <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 256 256"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                                      fill="#B8E6D3"
                                    />
                                    <path
                                      d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"
                                      fill="#2A6A52"
                                    />
                                  </svg>
                                  <div>
                                    <b>{c.ctitle}</b> {c.best}
                                    <br />
                                    {c.reason}
                                  </div>
                                </div>
                              </article>
                            </Fragment>
                          ))}
                        </section>
                        <section
                          className="ie-card ie-card--lav"
                          aria-labelledby="uv-note"
                          style={{ gap: "12px" }}
                        >
                          <h2 id="uv-note" className="ie-h3">
                            다 봤으면 마쳐요
                          </h2>
                          <p className="ie-body">
                            그때와 지금을 살펴봤으면 이 단위를 마칠 수 있어요. 마치면 내 학습 기록에
                            남아요.
                          </p>
                          <div className="ie-row">
                            <button
                              type="button"
                              className="ie-btn ie-btn--primary"
                              onClick={v.finishUnit}
                            >
                              이 단위 마치기
                            </button>
                            <button type="button" className="ie-btn ie-btn--text" onClick={v.again}>
                              이 단위 다시 해 보기
                            </button>
                          </div>
                        </section>
                      </>
                    ) : null}{" "}
                    {v.isDone ? (
                      <section
                        className="ie-pop ie-card ie-card--hero ie-card--mint"
                        role="status"
                        aria-labelledby="uv-done"
                        style={{ gap: "16px", alignItems: "flex-start" }}
                      >
                        <div className="ie-row" style={{ gap: "14px" }}>
                          <Gem kind={v.gemKind} size="56" />
                          <div className="ie-stack-s" style={{ gap: "2px" }}>
                            <span className="ie-status ie-status--done">했어요</span>
                            <h2 id="uv-done" className="ie-h2">
                              이 단위를 마쳤어요
                            </h2>
                          </div>
                        </div>
                        <p className="ie-body-lg">
                          {"안전·자기 보호 "}
                          {v.levelText}을 끝까지 해 봤어요. 점수는 없어요. 내 학습 기록에서 그때와
                          지금을 다시 볼 수 있어요.
                        </p>
                        {v.apiError ? (
                          <p className="ie-error-text" role="alert">
                            {v.apiError}
                          </p>
                        ) : null}
                        <div
                          className="ie-grid-auto"
                          style={{
                            width: "100%",
                            gridTemplateColumns: "repeat(auto-fit,minmax(min(200px,100%),1fr))",
                          }}
                        >
                          <A
                            className="ie-card"
                            href={ROUTES.talk}
                            style={{ gap: "6px", textDecoration: "none", color: "inherit" }}
                          >
                            <b className="ie-body ie-strong">이음쌤에게 쪽지 쓰기</b>
                            <span className="ie-body ie-sub">
                              하고 싶은 이야기가 있으면 남겨요.
                            </span>
                          </A>{" "}
                          <A
                            className="ie-card"
                            href={ROUTES.collection}
                            style={{ gap: "6px", textDecoration: "none", color: "inherit" }}
                          >
                            <b className="ie-body ie-strong">내 학습 기록 보기</b>
                            <span className="ie-body ie-sub">그때와 지금을 다시 봐요.</span>
                          </A>
                        </div>
                        <div className="ie-alert ie-alert--warm" style={{ width: "100%" }}>
                          <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                            <path
                              d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                              fill="#FFD6C1"
                            />
                            <path
                              d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                              fill="#94431F"
                            />
                          </svg>
                          <div>
                            <b>이 상황이 내 일 같다면 혼자 고민하지 않아도 돼요.</b>{" "}
                            <A href={ROUTES.talk}>이음상담소</A>
                            {"에서 쪽지를 쓰거나, 급하면 "}
                            <A href={ROUTES.help}>도움 받을 수 있는 곳</A>을 열어요.
                          </div>
                        </div>
                        <div className="ie-row">
                          <button type="button" className="ie-btn ie-btn--text" onClick={v.again}>
                            이 단위 다시 해 보기
                          </button>
                          <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.areas}>
                            다음 연습 고르기
                          </A>
                          <A className="ie-btn ie-btn--outline" href={ROUTES.home}>
                            홈으로 돌아가기
                          </A>
                        </div>
                      </section>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </>
    );
  }
}
