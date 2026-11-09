/**
 * S07 학습 단위 (질문지·카드·비교)
 * (원본 디자인: Unit.dc.html)
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
import pageCss from "./Unit.css?inline";

export default class Unit extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      phase: "pre",
      pre: {},
      post: {},
      card: 0,
      read: [false, false, false, false, false],
      paused: false,
      hint: "",
    };
  }
  renderVals() {
    const s = this.state;

    const Q: any = this.props.questions;
    const labelOf = (q, v) =>
      v === undefined ? "답하지 않았어요" : q.t === "sit" ? q.opts[v] : q.opts[v][0];
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
    const C: any = this.props.cards;
    const i = s.card;
    const cd = C[i];
    const read = s.read[i];
    const allRead = s.read.every(Boolean);
    const preN = Object.keys(s.pre).length;
    const postN = Object.keys(s.post).length;
    const phases = ["pre", "learn", "post", "compare", "done"];
    const labels = ["사전 질문지", "학습", "사후 질문지", "비교", "마침"];
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
    return {
      steps: labels.map((l, k) => ({
        label: l,
        mark: k < pi ? "✓" : String(k + 1),
        cls: k < pi ? "ie-step is-done" : "ie-step",
        current: k === pi ? "step" : "false",
      })),
      paused: s.paused,
      pause: () => this.setState({ paused: true }),
      resume: () => this.setState({ paused: false }),
      isPre: s.phase === "pre" && !s.paused,
      isLearn: s.phase === "learn" && !s.paused,
      isPost: s.phase === "post" && !s.paused,
      isCompare: s.phase === "compare" && !s.paused,
      isDone: s.phase === "done" && !s.paused,
      finishUnit: () => {
        void recordService.completeUnit({
          kind: "cards",
          level: this.props.level,
          pre: s.pre,
          post: s.post,
        });
        this.setState({ phase: "done" });
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
      cardNo: i + 1,
      card: {
        title: cd.title,
        l1: cd.l1,
        l2: cd.l2,
        c1: cd.c1,
        c2: cd.c2,
        read,
        is0: i === 0,
        is1: i === 1,
        is2: i === 2,
        is3: i === 3,
        is4: i === 4,
      },
      dots: C.map((c, k) => ({
        n: k + 1,
        label: "카드 " + (k + 1) + (s.read[k] ? " · 읽었어요" : ""),
        cur: k === i ? "step" : "false",
        cls: s.read[k]
          ? "ie-btn ie-btn--secondary"
          : k === i
            ? "ie-btn ie-btn--primary"
            : "ie-btn ie-btn--outline",
        go: () => this.setState({ card: k, hint: "" }),
      })),
      toggleRead: () => {
        const r = s.read.slice();
        r[i] = !r[i];
        this.setState({ read: r, hint: "" });
      },
      notLast: i < 4,
      isLast: i === 4,
      nextBlocked: !read,
      finishBlocked: !allRead,
      next: () => {
        if (!read) {
          this.setState({ hint: "카드를 읽었으면 “이 카드를 읽었어요”를 눌러 주세요." });
          return;
        }
        this.setState({ card: i + 1, hint: "" });
      },
      prev: () => this.setState({ card: Math.max(0, i - 1), hint: "" }),
      finish: () => {
        if (!allRead) {
          this.setState({
            hint: "아직 읽지 않은 카드가 있어요. 위의 번호로 이동해 읽었다고 눌러 주세요.",
          });
          return;
        }
        this.setState({ phase: "post", hint: "" });
      },
      showHint: s.hint !== "",
      hint: s.hint,
      cmp,
      again: () =>
        this.setState({
          phase: "pre",
          pre: {},
          post: {},
          card: 0,
          read: [false, false, false, false, false],
          hint: "",
        }),
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
              <section className="ie-banner ie-banner--mint ie-in" aria-labelledby="un-h">
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
                  <h1 id="un-h" className="ie-title">
                    안전·자기 보호
                  </h1>
                  <div className="ie-row">
                    <span className="ie-tag ie-tag--safety">안전</span>
                    <span className="ie-tag">오팔 · LEVEL 1</span>
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
                  <p className="ie-body-lg">
                    고른 내용은 저장돼 있어요. 준비되면 이어서 하면 돼요.
                  </p>
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
              ) : null}
              <div className="ie-layout" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                <div className="ie-stack">
                  {v.isPre ? (
                    <section className="ie-card" aria-labelledby="u-pre" style={{ gap: "20px" }}>
                      <div className="ie-stack-s" style={{ gap: "6px" }}>
                        <h2 id="u-pre" className="ie-h2">
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
                          학습 카드 보러 가기
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
                  {v.isLearn ? (
                    <section className="ie-card" aria-labelledby="u-learn" style={{ gap: "18px" }}>
                      <h2 id="u-learn" className="ie-h2">
                        {"2. 학습 카드 "}
                        {v.cardNo}
                        {" / 5"}
                      </h2>
                      <ul className="ie-row" aria-label="카드 진행" style={{ gap: "6px" }}>
                        {(v.dots || []).map((d: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <li>
                              <button
                                type="button"
                                className={d.cls}
                                aria-label={d.label}
                                aria-current={d.cur}
                                onClick={d.go}
                                style={{
                                  minHeight: "44px",
                                  minWidth: "44px",
                                  padding: "4px 10px",
                                  justifyContent: "center",
                                }}
                              >
                                {d.n}
                              </button>
                            </li>
                          </Fragment>
                        ))}
                      </ul>
                      <div
                        className="ie-media ie-media--img"
                        style={{ aspectRatio: "16 / 6" }}
                        aria-hidden="true"
                      >
                        {v.card.is0 ? (
                          <img className="ie-uimg" src={img.unitCard1} alt="" draggable="false" />
                        ) : null}
                        {v.card.is1 ? (
                          <img className="ie-uimg" src={img.unitCard2} alt="" draggable="false" />
                        ) : null}
                        {v.card.is2 ? (
                          <img className="ie-uimg" src={img.unitCard3} alt="" draggable="false" />
                        ) : null}
                        {v.card.is3 ? (
                          <img className="ie-uimg" src={img.unitCard4} alt="" draggable="false" />
                        ) : null}
                        {v.card.is4 ? (
                          <img className="ie-uimg" src={img.unitCard5} alt="" draggable="false" />
                        ) : null}
                      </div>
                      <div className="ie-learnpanel">
                        <span className="ie-eyebrow">
                          {"카드 "}
                          {v.cardNo}
                          {" / 5"}
                        </span>
                        <h3 className="ie-h3">{v.card.title}</h3>
                        <p className="ie-body-lg">{v.card.l1}</p>
                        <p className="ie-body-lg">{v.card.l2}</p>
                      </div>
                      <hr className="ie-divider" />
                      <div className="ie-row-between">
                        <button
                          type="button"
                          className="ie-chip"
                          aria-pressed={v.card.read}
                          onClick={v.toggleRead}
                        >
                          <span className="ie-box" />이 카드를 읽었어요
                        </button>
                        <div className="ie-row">
                          <button type="button" className="ie-btn ie-btn--outline" onClick={v.prev}>
                            이전 카드
                          </button>{" "}
                          {v.notLast ? (
                            <button
                              type="button"
                              className="ie-btn ie-btn--primary"
                              aria-disabled={v.nextBlocked}
                              onClick={v.next}
                            >
                              다음 카드
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
                  ) : null}{" "}
                  {v.isPost ? (
                    <section className="ie-card" aria-labelledby="u-post" style={{ gap: "20px" }}>
                      <div className="ie-stack-s" style={{ gap: "6px" }}>
                        <h2 id="u-post" className="ie-h2">
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
                      <section className="ie-card" aria-labelledby="u-cmp" style={{ gap: "20px" }}>
                        <div className="ie-stack-s" style={{ gap: "6px" }}>
                          <h2 id="u-cmp" className="ie-h2">
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
                        aria-labelledby="u-note"
                        style={{ gap: "12px" }}
                      >
                        <h2 id="u-note" className="ie-h3">
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
                      aria-labelledby="u-done"
                      style={{ gap: "16px", alignItems: "flex-start" }}
                    >
                      <div className="ie-donehero" aria-hidden="true">
                        <svg
                          viewBox="0 0 520 200"
                          preserveAspectRatio="xMaxYMid meet"
                          aria-hidden="true"
                        >
                          <defs>
                            <radialGradient id="bd-r" cx=".5" cy=".5" r=".5">
                              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
                              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          <circle
                            className="ie-a-ring"
                            style={{ animationDelay: "-0s" }}
                            cx="300"
                            cy="100"
                            r="44"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3"
                          />
                          <circle
                            className="ie-a-ring"
                            style={{ animationDelay: "-1.2s" }}
                            cx="300"
                            cy="100"
                            r="44"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3"
                          />
                          <circle
                            className="ie-a-ring"
                            style={{ animationDelay: "-2.4s" }}
                            cx="300"
                            cy="100"
                            r="44"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3"
                          />
                          <circle cx="300" cy="100" r="84" fill="url(#bd-r)" />
                          <g className="ie-a-bob" style={{ animationDelay: "-0.2s" }}>
                            <svg
                              viewBox="0 0 40 40"
                              x="266"
                              y="64"
                              width="68"
                              height="68"
                              overflow="visible"
                            >
                              <defs>
                                <radialGradient id="gm-opal" cx=".38" cy=".3" r=".85">
                                  <stop offset="0" stopColor="#FFFFFF" />
                                  <stop offset=".6" stopColor="#FCEFF4" />
                                  <stop offset="1" stopColor="#E7DBF6" />
                                </radialGradient>
                                <clipPath id="gm-opal-c">
                                  <ellipse cx="20" cy="19.6" rx="13.4" ry="16.4" />
                                </clipPath>
                                <radialGradient id="gm-opal-s" cx=".5" cy=".5" r=".6">
                                  <stop offset=".7" stopColor="#FFFFFF" stopOpacity="0" />
                                  <stop offset="1" stopColor="#9A7BC8" stopOpacity=".22" />
                                </radialGradient>
                                <radialGradient id="gm-opal-9FE0E8">
                                  <stop offset="0" stopColor="#9FE0E8" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#9FE0E8" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="gm-opal-FFC9AE">
                                  <stop offset="0" stopColor="#FFC9AE" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#FFC9AE" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="gm-opal-C9B8FF">
                                  <stop offset="0" stopColor="#C9B8FF" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#C9B8FF" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="gm-opal-F9C3DA">
                                  <stop offset="0" stopColor="#F9C3DA" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#F9C3DA" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="gm-opal-FFF1B8">
                                  <stop offset="0" stopColor="#FFF1B8" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#FFF1B8" stopOpacity="0" />
                                </radialGradient>
                                <clipPath id="gm-opal-fx">
                                  <ellipse cx="20" cy="19.6" rx="13.4" ry="16.4" />
                                </clipPath>
                                <linearGradient id="gm-opal-fx-g" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0" stopColor="#FFFFFF" stopOpacity=".42" />
                                  <stop offset=".34" stopColor="#FFFFFF" stopOpacity=".08" />
                                  <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
                                </linearGradient>
                                <radialGradient id="gm-opal-fx-v" cx=".38" cy=".3" r=".85">
                                  <stop offset=".5" stopColor="#C9B8FF" stopOpacity="0" />
                                  <stop offset="1" stopColor="#C9B8FF" stopOpacity=".42" />
                                </radialGradient>
                                <radialGradient id="gm-opal-fx-b" cx=".58" cy=".92" r=".55">
                                  <stop offset="0" stopColor="#FFFFFF" stopOpacity=".75" />
                                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                                </radialGradient>
                                <radialGradient id="gm-opal-fx-s" cx=".5" cy=".5" r=".5">
                                  <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
                                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                                </radialGradient>
                                <filter
                                  id="gm-opal-fx-sh"
                                  x="-30%"
                                  y="-30%"
                                  width="160%"
                                  height="180%"
                                >
                                  <feGaussianBlur stdDeviation="1.1" />
                                </filter>
                                <filter
                                  id="gm-opal-fx-lit"
                                  x="-8%"
                                  y="-8%"
                                  width="116%"
                                  height="120%"
                                  colorInterpolationFilters="sRGB"
                                >
                                  <feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="bb" />
                                  <feSpecularLighting
                                    in="bb"
                                    surfaceScale="2.4"
                                    specularConstant=".5"
                                    specularExponent="20"
                                    lightingColor="#FFFFFF"
                                    result="sp"
                                  >
                                    <feDistantLight azimuth="225" elevation="52" />
                                  </feSpecularLighting>
                                  <feComposite
                                    in="sp"
                                    in2="SourceAlpha"
                                    operator="in"
                                    result="spi"
                                  />
                                  <feComposite
                                    in="SourceGraphic"
                                    in2="spi"
                                    operator="arithmetic"
                                    k1="0"
                                    k2="1"
                                    k3=".35"
                                    k4="0"
                                  />
                                </filter>
                              </defs>
                              <ellipse
                                cx="20"
                                cy="37.4"
                                rx="10.5"
                                ry="1.9"
                                fill="#3E4A8A"
                                opacity=".28"
                                filter="url(#gm-opal-fx-sh)"
                              />
                              <g filter="url(#gm-opal-fx-lit)">
                                <ellipse
                                  cx="20"
                                  cy="19.6"
                                  rx="13.4"
                                  ry="16.4"
                                  fill="url(#gm-opal)"
                                  stroke="#5C3C28"
                                  strokeOpacity=".16"
                                  strokeWidth=".5"
                                  strokeLinejoin="round"
                                />
                                <g clipPath="url(#gm-opal-c)">
                                  <circle
                                    cx="26"
                                    cy="27"
                                    r="9"
                                    fill="url(#gm-opal-9FE0E8)"
                                    opacity="1"
                                  />
                                  <circle
                                    cx="13.5"
                                    cy="26"
                                    r="8"
                                    fill="url(#gm-opal-FFC9AE)"
                                    opacity="1"
                                  />
                                  <circle
                                    cx="25"
                                    cy="13"
                                    r="8"
                                    fill="url(#gm-opal-C9B8FF)"
                                    opacity="1"
                                  />
                                  <circle
                                    cx="15"
                                    cy="13"
                                    r="7"
                                    fill="url(#gm-opal-F9C3DA)"
                                    opacity="1"
                                  />
                                  <circle
                                    cx="20"
                                    cy="21"
                                    r="6"
                                    fill="url(#gm-opal-FFF1B8)"
                                    opacity="1"
                                  />
                                </g>
                                <ellipse
                                  cx="20"
                                  cy="19.6"
                                  rx="13.4"
                                  ry="16.4"
                                  fill="url(#gm-opal-s)"
                                />
                                <path
                                  d="M12.4 10.6Q14.2 6.8 19 5.8"
                                  fill="none"
                                  stroke="#FFFFFF"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  opacity=".95"
                                />
                                <ellipse
                                  cx="14.4"
                                  cy="11.4"
                                  rx="2.6"
                                  ry="1.5"
                                  fill="#FFFFFF"
                                  opacity=".85"
                                  transform="rotate(-38 14.4 11.4)"
                                />
                                <path
                                  d="M27.4 29.4Q24.4 33.6 19.6 34.4"
                                  fill="none"
                                  stroke="#FFFFFF"
                                  strokeWidth="1"
                                  strokeLinecap="round"
                                  opacity=".55"
                                />
                                <g clipPath="url(#gm-opal-fx)">
                                  <rect
                                    x="0"
                                    y="0"
                                    width="40"
                                    height="40"
                                    fill="url(#gm-opal-fx-v)"
                                  />
                                  <ellipse
                                    cx="24"
                                    cy="33"
                                    rx="12"
                                    ry="6"
                                    fill="url(#gm-opal-fx-b)"
                                  />
                                  <rect
                                    x="0"
                                    y="0"
                                    width="40"
                                    height="40"
                                    fill="url(#gm-opal-fx-g)"
                                  />
                                  <g strokeLinejoin="round">
                                    <ellipse
                                      fill="none"
                                      stroke="#FFFFFF"
                                      strokeOpacity=".42"
                                      strokeWidth=".9"
                                      cx="20"
                                      cy="19.6"
                                      rx="13.4"
                                      ry="16.4"
                                    />
                                  </g>
                                  <circle
                                    cx="13.5"
                                    cy="12"
                                    r="3.2"
                                    fill="url(#gm-opal-fx-s)"
                                    opacity=".55"
                                  />
                                </g>
                              </g>
                            </svg>
                          </g>
                          <g className="ie-a-bob" style={{ animationDelay: "-0.0s" }}>
                            <rect
                              x="120"
                              y="40"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#F4A68C"
                              transform="rotate(20 120 40)"
                            />
                          </g>
                          <g className="ie-a-bob" style={{ animationDelay: "-0.6s" }}>
                            <rect
                              x="190"
                              y="150"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#9F8FE8"
                              transform="rotate(-30 190 150)"
                            />
                          </g>
                          <g className="ie-a-bob" style={{ animationDelay: "-1.2s" }}>
                            <rect
                              x="420"
                              y="40"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#7CCBAE"
                              transform="rotate(40 420 40)"
                            />
                          </g>
                          <g
                            className="ie-a-bob"
                            style={{ animationDelay: "-1.7999999999999998s" }}
                          >
                            <rect
                              x="470"
                              y="130"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#F6C86A"
                              transform="rotate(-20 470 130)"
                            />
                          </g>
                          <g className="ie-a-bob" style={{ animationDelay: "-2.4s" }}>
                            <rect
                              x="380"
                              y="170"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#F4A6A6"
                              transform="rotate(10 380 170)"
                            />
                          </g>
                          <g className="ie-a-bob" style={{ animationDelay: "-3.0s" }}>
                            <rect
                              x="150"
                              y="100"
                              width="14"
                              height="7"
                              rx="3.5"
                              fill="#7BC8FF"
                              transform="rotate(60 150 100)"
                            />
                          </g>
                          <path
                            d="M90 111Q91.08 118.92 99 120Q91.08 121.08 90 129Q88.92 121.08 81 120Q88.92 118.92 90 111z"
                            fill="#FFFFFF"
                            opacity="0.9"
                            className="ie-a-spark"
                            style={{ animationDelay: "0.0s" }}
                          />
                          <path
                            d="M500 62Q500.96 69.04 508 70Q500.96 70.96 500 78Q499.04 70.96 492 70Q499.04 69.04 500 62z"
                            fill="#FFFFFF"
                            opacity="0.9"
                            className="ie-a-spark"
                            style={{ animationDelay: "2.0s" }}
                          />
                          <path
                            d="M240 169Q240.84 175.16 247 176Q240.84 176.84 240 183Q239.16 176.84 233 176Q239.16 175.16 240 169z"
                            fill="#FFFFFF"
                            opacity="0.9"
                            className="ie-a-spark"
                            style={{ animationDelay: "1.8s" }}
                          />
                          <path
                            d="M360 21Q360.84 27.16 367 28Q360.84 28.84 360 35Q359.16 28.84 353 28Q359.16 27.16 360 21z"
                            fill="#FFFFFF"
                            opacity="0.9"
                            className="ie-a-spark"
                            style={{ animationDelay: "2.4s" }}
                          />
                          <path
                            className="ie-a-beat"
                            style={{ animationDelay: "-0.0s" }}
                            d="M440 105.4 C430.1 99.1 434.6 91.0 440 96.85 C445.4 91.0 449.9 99.1 440 105.4 Z"
                            fill="#F4A6A6"
                            opacity="0.9"
                          />
                        </svg>
                      </div>
                      <div className="ie-row" style={{ gap: "14px" }}>
                        <Gem kind="opal" size="56" />
                        <div className="ie-stack-s" style={{ gap: "2px" }}>
                          <span className="ie-status ie-status--done">했어요</span>
                          <h2 id="u-done" className="ie-h2">
                            이 단위를 마쳤어요
                          </h2>
                        </div>
                      </div>
                      <p className="ie-body-lg">
                        안전·자기 보호 LEVEL 1을 끝까지 해 봤어요. 점수는 없어요. 내 학습 기록에서
                        그때와 지금을 다시 볼 수 있어요.
                      </p>
                      <div
                        className="ie-grid-auto"
                        style={{
                          width: "100%",
                          gridTemplateColumns: "repeat(auto-fit,minmax(min(200px,100%),1fr))",
                        }}
                      >
                        <A
                          className="ie-card"
                          href={ROUTES.areas}
                          style={{ gap: "6px", textDecoration: "none", color: "inherit" }}
                        >
                          <b className="ie-body ie-strong">다음 연습 고르기</b>
                          <span className="ie-body ie-sub">마음이 가는 연습부터 골라요.</span>
                        </A>{" "}
                        <A
                          className="ie-card"
                          href={ROUTES.talk}
                          style={{ gap: "6px", textDecoration: "none", color: "inherit" }}
                        >
                          <b className="ie-body ie-strong">이음쌤에게 쪽지 쓰기</b>
                          <span className="ie-body ie-sub">하고 싶은 이야기가 있으면 남겨요.</span>
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
                        <A className="ie-btn ie-btn--outline" href={ROUTES.home}>
                          홈으로 돌아가기
                        </A>
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }
}
