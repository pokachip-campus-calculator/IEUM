/**
 * S09 감정 읽기
 * (원본 디자인: Emotion.dc.html)
 */
import { Component, Fragment } from "react";
import { recordService } from "@/api";
import { A } from "@/lib/A";
import { css } from "@/lib/css";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Emotion.css?inline";

export default class Emotion extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      phase: "look",
      clues: [],
      feels: [],
      note: "",
      apiError: "",
    };
  }
  componentDidMount() {
    // "잠시 쉬기"로 저장해 둔 진행 중 기록이 있으면 고른 단서·마음을 그대로 이어서 보여 줘요.
    const draft = recordService.restoreEmotionProgress(this.props.record);
    if (!draft) return;
    this.setState({
      clues: draft.clues,
      feels: draft.feels,
      phase: draft.clues.length + draft.feels.length > 0 ? "pick" : "look",
    });
  }
  /** "잠시 쉬기": 홈으로 나가기 전에 지금까지 고른 것을 진행 중으로 저장해요(이동은 막지 않아요). */
  pauseAndLeave = () => {
    void recordService
      .saveEmotionProgress({
        practiceId: this.props.practiceId,
        clues: this.state.clues,
        feelings: this.state.feels,
      })
      .catch(() => undefined);
  };
  renderVals() {
    const CL: any = this.props.clues;
    const FE: any = this.props.feelings;
    const UNSURE = "잘 모르겠어요";
    const s = this.state;
    const toggleFeel = (f) => {
      const on = s.feels.indexOf(f) !== -1;
      if (on) {
        this.setState({ feels: s.feels.filter((x) => x !== f), note: "" });
        return;
      }
      if (f === UNSURE) {
        this.setState({
          feels: [UNSURE],
          note: s.feels.length ? "'잘 모르겠어요'를 골라서 다른 마음 선택을 풀었어요." : "",
        });
      } else {
        const had = s.feels.indexOf(UNSURE) !== -1;
        this.setState({
          feels: s.feels.filter((x) => x !== UNSURE).concat([f]),
          note: had ? "다른 마음을 골라서 '잘 모르겠어요' 선택을 풀었어요." : "",
        });
      }
    };
    const idx = s.phase === "look" ? 0 : s.phase === "pick" ? 1 : 2;
    const steps = ["장면 보기", "단서와 마음 고르기", "생각 정리하기"].map((l, i) => ({
      label: l,
      mark: i < idx ? "✓" : String(i + 1),
      cls: i < idx ? "ie-step is-done" : "ie-step",
      current: i === idx ? "step" : "false",
    }));
    const any = s.clues.length + s.feels.length > 0;
    return {
      steps,
      looking: s.phase === "look",
      picking: s.phase === "pick",
      reflecting: s.phase === "reflect",
      clues: CL.map((c) => {
        const on = s.clues.indexOf(c) !== -1;
        return {
          label: c,
          on,
          toggle: () =>
            this.setState({ clues: on ? s.clues.filter((x) => x !== c) : s.clues.concat([c]) }),
        };
      }),
      feels: FE.map((f) => ({
        label: f,
        on: s.feels.indexOf(f) !== -1,
        dash: f === UNSURE ? "dashed" : "solid",
        toggle: () => toggleFeel(f),
      })),
      swapNote: s.note,
      apiError: s.apiError,
      canNext: any,
      cantNext: !any,
      pickedClues: s.clues,
      pickedFeels: s.feels,
      noClues: s.clues.length === 0,
      noFeels: s.feels.length === 0,
      toReflect: async () => {
        this.setState({ apiError: "" });
        try {
          await recordService.saveEmotionReading({
            practiceId: this.props.practiceId,
            clues: s.clues,
            feelings: s.feels,
          });
          this.setState({ phase: "reflect" });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "기록을 저장하지 못했어요.",
          });
        }
      },
      toPick: () => this.setState({ phase: "pick" }),
      back: () => this.setState({ phase: "pick" }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="emotion" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <SideNav active="emotion" />
            </div>
            <main className="ie-main ie-main--story">
              <header className="ie-banner ie-banner--lav ie-sthead ie-in">
                <nav className="ie-crumb" aria-label="현재 위치">
                  <A href={ROUTES.areas}>학습 영역</A>
                  <span aria-hidden="true">›</span>
                  <span>감정 읽기</span>
                </nav>
                <div className="ie-sthead-row">
                  <h1 id="em-h" className="ie-title">
                    혼자 떨어져 앉은 친구
                  </h1>
                  <A
                    className="ie-btn ie-btn--outline"
                    href={ROUTES.home}
                    onClick={this.pauseAndLeave}
                  >
                    잠시 쉬기
                  </A>
                </div>
                <ol className="ie-track" aria-label="이야기 단계">
                  {(v.steps || []).map((st: any, __i0: number) => (
                    <Fragment key={__i0}>
                      <li className={st.cls} aria-current={st.current}>
                        <span className="ie-step-num">{st.mark}</span>
                        <span className="ie-track-l">{st.label}</span>
                      </li>
                    </Fragment>
                  ))}
                </ol>
                <div className="ie-banner-art ie-fade-l">
                  <img className="ie-3img" src={img.bannerEmotion} alt="" draggable="false" />
                </div>
              </header>
              <div className="ie-story ie-in" style={{ "--d": "1" } as CSSProperties}>
                <figure className="ie-scene ie-scene--wide" aria-labelledby="scene">
                  <div
                    className="ie-media"
                    style={{ aspectRatio: "auto", height: "100%" }}
                    aria-hidden="true"
                  >
                    <img
                      src={img.emotionScene}
                      alt=""
                      draggable="false"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center 40%",
                      }}
                    />
                  </div>
                  <figcaption className="ie-sr">
                    장면 설명: 급식실에서 친구들은 한 테이블에 모여 웃으며 이야기하고, 한 친구가
                    조금 떨어진 자리에 혼자 앉아 아래를 보고 있어요.
                  </figcaption>
                  <div className="ie-bubble">
                    <span className="ie-eyebrow">장면</span>
                    <h2 id="scene" className="ie-bubble-t">
                      점심시간에 함께 이야기하던 친구가 대화가 끝나자 혼자 떨어져 앉았어요.
                    </h2>
                  </div>
                </figure>
                {v.looking ? (
                  <div className="ie-dock ie-dock--span">
                    <button
                      type="button"
                      className="ie-btn ie-btn--primary ie-btn--lg"
                      onClick={v.toPick}
                    >
                      단서 찾으러 가기
                    </button>
                  </div>
                ) : null}{" "}
                {v.picking ? (
                  <div className="ie-twin">
                    <section className="ie-ask" aria-labelledby="q1">
                      <div className="ie-ask-head">
                        <span className="ie-eyebrow">1 · 관찰한 사실</span>
                        <h2 id="q1" className="ie-h3">
                          눈으로 볼 수 있는 단서는 무엇인가요?
                        </h2>
                        <p className="ie-body ie-sub">보이는 것만 골라요. 여러 개 골라도 돼요.</p>
                      </div>
                      <div
                        className="ie-choices ie-choices--list"
                        role="group"
                        aria-labelledby="q1"
                      >
                        {(v.clues || []).map((c: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <button
                              type="button"
                              role="checkbox"
                              className="ie-option ie-option--row"
                              aria-checked={c.on}
                              onClick={c.toggle}
                            >
                              <span className="ie-box" />
                              <span>{c.label}</span>
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    </section>
                    <section className="ie-ask ie-ask--lav" aria-labelledby="q2">
                      <div className="ie-ask-head">
                        <span className="ie-eyebrow">2 · 짐작한 마음</span>
                        <h2 id="q2" className="ie-h3">
                          이 친구는 어떤 마음일까요?
                        </h2>
                        <p className="ie-body ie-sub">
                          여러 개 골라도 돼요. '잘 모르겠어요'는 다른 마음과 함께 고를 수 없어요.
                        </p>
                      </div>
                      <div className="ie-row" role="group" aria-labelledby="q2">
                        {(v.feels || []).map((f: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <button
                              type="button"
                              className="ie-chip ie-chip--lg"
                              aria-pressed={f.on}
                              onClick={f.toggle}
                              style={css(`border-style: ${f.dash}`)}
                            >
                              <span className="ie-box" />
                              {f.label}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                      {v.swapNote ? (
                        <p className="ie-help" role="status">
                          {v.swapNote}
                        </p>
                      ) : null}
                      <div className="ie-tip">
                        <b>관찰과 짐작은 달라요</b>
                        <p className="ie-body">
                          <b>관찰</b>
                          은 누가 봐도 같은 것 (예: 시선이 아래를 향해요)
                          <br />
                          <b>짐작</b>은 내가 떠올린 마음 (예: 서운한 것 같아요)
                        </p>
                      </div>
                    </section>
                    <div className="ie-dock ie-dock--span">
                      {v.canNext ? (
                        <button
                          type="button"
                          className="ie-btn ie-btn--primary ie-btn--lg"
                          onClick={v.toReflect}
                        >
                          생각 정리하기
                        </button>
                      ) : null}{" "}
                      {v.cantNext ? (
                        <>
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary ie-btn--lg"
                            aria-disabled="true"
                          >
                            생각 정리하기
                          </button>
                          <span className="ie-help">
                            단서나 마음을 하나 이상 고르면 다음으로 갈 수 있어요.
                          </span>
                        </>
                      ) : null}
                      {v.apiError ? (
                        <p className="ie-error-text" role="alert">
                          {v.apiError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}{" "}
                {v.reflecting ? (
                  <section className="ie-ask" aria-labelledby="sum">
                    <h2 id="sum" className="ie-h2">
                      관찰과 짐작을 나눠 볼까요?
                    </h2>
                    <div className="ie-grid-2">
                      <div className="ie-card ie-card--sky" style={{ gap: "10px" }}>
                        <b className="ie-body ie-strong">내가 관찰한 사실</b>
                        <ul className="ie-stack-s ie-body">
                          {(v.pickedClues || []).map((x: any, __i0: number) => (
                            <Fragment key={__i0}>
                              <li>
                                {"· "}
                                {x}
                              </li>
                            </Fragment>
                          ))}
                        </ul>
                        {v.noClues ? (
                          <span className="ie-body ie-sub">고른 단서가 없어요.</span>
                        ) : null}
                      </div>
                      <div className="ie-card ie-card--lav" style={{ gap: "10px" }}>
                        <b className="ie-body ie-strong">내가 짐작한 마음</b>
                        <ul className="ie-stack-s ie-body">
                          {(v.pickedFeels || []).map((x: any, __i0: number) => (
                            <Fragment key={__i0}>
                              <li>
                                {"· "}
                                {x}
                              </li>
                            </Fragment>
                          ))}
                        </ul>
                        {v.noFeels ? (
                          <span className="ie-body ie-sub">고른 마음이 없어요.</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="ie-alert ie-alert--info">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#BFDDFF" />
                        <path
                          d="M144,176a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176Zm88-48A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128ZM124,96a12,12,0,1,0-12-12A12,12,0,0,0,124,96Z"
                          fill="#2B5C96"
                        />
                      </svg>
                      <span>
                        <b>표정만으로 마음을 단정할 수는 없어요.</b>
                        {" 짐작은 짐작으로 두고, 궁금하면 직접 물어봐도 괜찮아요."}
                      </span>
                    </div>
                    <div className="ie-card ie-card--mint" style={{ gap: "8px" }}>
                      <b className="ie-body ie-strong">눈여겨볼 단서</b>
                      <p className="ie-body">
                        시선이 아래로 향하고, 혼자 떨어져 앉은 모습이에요. 같은 장면에서도 사람마다
                        다르게 느껴요. 정답이 하나는 아니에요.
                      </p>
                    </div>
                    <div className="ie-card ie-card--flat" style={{ gap: "6px" }}>
                      <span className="ie-eyebrow">이렇게 물어볼 수 있어요</span>
                      <p className="ie-body-lg">"괜찮아? 이야기하고 싶으면 언제든 들을게."</p>
                    </div>
                    <div className="ie-dock">
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline ie-btn--lg"
                        onClick={v.back}
                      >
                        다시 골라 보기
                      </button>{" "}
                      <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.areas}>
                        다음 연습 고르기
                      </A>
                    </div>
                  </section>
                ) : null}
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }
}
