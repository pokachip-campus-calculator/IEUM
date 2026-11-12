/**
 * S08 시나리오 연습
 * (원본 디자인: Scenario.dc.html)
 */
import { Component, Fragment } from "react";
import { recordService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Scenario.css?inline";

export default class Scenario extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      sid: "secret",
      phase: "meet",
      pick: null,
      paused: false,
      feels: [],
      apiError: "",
    };
  }
  componentDidMount() {
    // "잠시 쉬기"로 저장해 둔 진행 중 기록이 있으면 고른 방법·마음을 그대로 이어서 보여 줘요.
    const sc = this.props.scenarios[this.state.sid] || this.props.scenarios.secret;
    const draft = recordService.restoreScenarioProgress(this.props.record, sc.choices.length);
    if (!draft) return;
    this.setState({
      pick: draft.pick,
      feels: draft.feels,
      phase: draft.pick === null ? "choose" : "result",
    });
  }
  renderVals() {
    const SC: any = this.props.scenarios;
    const s = this.state;
    const sc = SC[s.sid] || SC.secret;
    const C = sc.choices;
    const order = ["meet", "choose", "result"];
    const idx = order.indexOf(s.phase);
    const labels = ["상황 만나기", "선택하기", "결과 살펴보기"];
    const cur = idx;
    const steps = labels.map((l, i) => ({
      label: l,
      mark: i < cur ? "✓" : String(i + 1),
      cls: i < cur ? "ie-step is-done" : "ie-step",
      current: i === cur ? "step" : "false",
    }));
    return {
      steps,
      sc: {
        title: sc.title,
        img: sc.img,
        alt: sc.alt,
        situation: sc.situation,
        remember: sc.remember,
      },
      scList: Object.keys(SC).map((k) => ({
        label: SC[k].label,
        on: s.sid === k,
        pick: () =>
          this.setState({
            sid: k,
            phase: "meet",
            pick: null,
            paused: false,
            feels: [],
          }),
      })),
      paused: s.paused,
      active: !s.paused,
      meeting: s.phase === "meet",
      choosing: s.phase === "choose",
      showResult: s.phase === "result",
      hasPick: s.pick !== null,
      noPick: s.pick === null,
      choices: C.map((c, i) => ({
        text: c.text,
        on: s.pick === i,
        pick: () => this.setState({ pick: i }),
      })),
      picked: s.pick !== null ? C[s.pick] : { text: "", follow: "", hear: "" },
      apiError: s.apiError,
      toChoose: () => this.setState({ phase: "choose" }),
      // 결과 화면으로 넘어갈 때 완료(done:true)로 저장해요. 저장이 실패해도 결과는 보여 줘요.
      toResult: async () => {
        this.setState({ apiError: "" });
        if (s.pick !== null) {
          try {
            await recordService.saveScenarioReflection({
              practiceId: this.props.practiceId,
              scenario: s.sid,
              choice: s.pick,
              feelings: [],
            });
          } catch (error) {
            this.setState({
              apiError: error instanceof Error ? error.message : "기록을 저장하지 못했어요.",
            });
          }
        }
        this.setState({ phase: "result" });
      },
      rechoose: () => this.setState({ phase: "choose" }),
      pause: async () => {
        this.setState({ paused: true, apiError: "" });
        try {
          await recordService.saveScenarioProgress({
            practiceId: this.props.practiceId,
            choice: s.pick,
            feelings: s.feels,
          });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "진행 상황을 저장하지 못했어요.",
          });
        }
      },
      resume: () => this.setState({ paused: false }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="scenario" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <SideNav active="scenario" />
            </div>
            <main className="ie-main ie-main--story">
              <header className="ie-banner ie-banner--peach ie-sthead ie-in">
                <nav className="ie-crumb" aria-label="현재 위치">
                  <A href={ROUTES.areas}>학습 영역</A>
                  <span aria-hidden="true">›</span>
                  <span>시나리오 연습</span>
                </nav>
                <div className="ie-sthead-row">
                  <h1 id="sc-h" className="ie-title">
                    {v.sc.title}
                  </h1>
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
                  <img className="ie-3img" src={img.bannerScenario} alt="" draggable="false" />
                </div>
              </header>
              {v.paused ? (
                <section
                  className="ie-card ie-card--hero ie-card--lav"
                  role="status"
                  style={{ alignItems: "flex-start" }}
                >
                  <h2 className="ie-h2">잠시 쉬어요</h2>
                  <p className="ie-body-lg">
                    고른 내용은 이 화면에 그대로 있어요. 준비되면 이어서 하면 돼요.
                  </p>
                  {v.apiError ? (
                    <p className="ie-error-text" role="alert">
                      {v.apiError}
                    </p>
                  ) : null}
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
              {v.active ? (
                <div className="ie-story ie-in" style={{ "--d": "1" } as CSSProperties}>
                  <figure className="ie-scene" aria-labelledby="sit">
                    <div
                      className="ie-media"
                      style={{ aspectRatio: "auto", height: "100%" }}
                      aria-hidden="true"
                    >
                      <img
                        src={v.sc.img}
                        alt=""
                        draggable="false"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "14px 0 30px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <figcaption className="ie-sr">
                      {"장면 설명: "}
                      {v.sc.alt}
                    </figcaption>
                    <div className="ie-bubble">
                      <span className="ie-eyebrow">상황</span>
                      <h2 id="sit" className="ie-bubble-t">
                        {v.sc.situation}
                      </h2>
                    </div>
                  </figure>
                  {v.meeting ? (
                    <section className="ie-ask" aria-label="상황 만나기">
                      <div className="ie-dock">
                        <button
                          type="button"
                          className="ie-btn ie-btn--primary ie-btn--lg"
                          onClick={v.toChoose}
                        >
                          어떻게 해야 할까요?
                        </button>
                      </div>
                    </section>
                  ) : null}{" "}
                  {v.choosing ? (
                    <section className="ie-ask" aria-labelledby="ask">
                      <div className="ie-ask-head">
                        <h2 id="ask" className="ie-h2">
                          어떻게 해야 할까요?
                        </h2>
                        <p className="ie-body ie-sub">
                          하나를 골라요. 결과를 본 뒤 다른 선택도 언제든 해 볼 수 있어요.
                        </p>
                      </div>
                      <div role="radiogroup" aria-labelledby="ask" className="ie-choices">
                        {(v.choices || []).map((c: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <button
                              type="button"
                              role="radio"
                              className="ie-option ie-option--card"
                              aria-checked={c.on}
                              onClick={c.pick}
                            >
                              <span className="ie-letter" aria-hidden="true" />
                              <span className="ie-opt-t">{c.text}</span>
                              <span className="ie-opt-ck" aria-hidden="true">
                                <svg
                                  viewBox="0 0 24 24"
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                              </span>
                            </button>
                          </Fragment>
                        ))}
                      </div>
                      <div className="ie-dock">
                        {v.hasPick ? (
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary ie-btn--lg"
                            onClick={v.toResult}
                          >
                            결과 살펴보기
                          </button>
                        ) : null}{" "}
                        {v.noPick ? (
                          <>
                            <button
                              type="button"
                              className="ie-btn ie-btn--primary ie-btn--lg"
                              aria-disabled="true"
                            >
                              결과 살펴보기
                            </button>
                            <span className="ie-help">
                              선택지를 하나 고르면 결과를 볼 수 있어요.
                            </span>
                          </>
                        ) : null}
                      </div>
                    </section>
                  ) : null}{" "}
                  {v.showResult ? (
                    <section className="ie-ask" aria-labelledby="res">
                      <div className="ie-res-pick">
                        <span className="ie-eyebrow">내가 고른 방법</span>
                        <h2 id="res" className="ie-h3">
                          {v.picked.text}
                        </h2>
                      </div>
                      <div className="ie-res-grid">
                        <div className="ie-bcard ie-bcard--follow">
                          <span className="ie-eyebrow">이렇게 이어질 수 있어요</span>
                          <p className="ie-body-lg">{v.picked.follow}</p>
                        </div>
                        <div className="ie-bcard ie-bcard--hear">
                          <span className="ie-eyebrow">이렇게 들릴 수 있어요</span>
                          <p className="ie-body-lg">{v.picked.hear}</p>
                        </div>
                      </div>
                      <p className="ie-body ie-strong">
                        한 번 더 생각해 볼까요? 다른 선택을 해 보면 어떻게 이어질지도 볼 수 있어요.
                      </p>
                      <div className="ie-remember">
                        <b className="ie-body ie-strong">어떤 선택을 했든 함께 기억해요</b>
                        <ul className="ie-stack-s ie-body">
                          {(v.sc.remember || []).map((r: any, __i0: number) => (
                            <Fragment key={__i0}>
                              <li>
                                {"· "}
                                {r}
                              </li>
                            </Fragment>
                          ))}
                        </ul>
                      </div>
                      {v.apiError ? (
                        <p className="ie-error-text" role="alert">
                          {v.apiError}
                        </p>
                      ) : null}
                      <div className="ie-dock">
                        <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.collection}>
                          내 학습 기록에서 보기
                        </A>{" "}
                        <A
                          className="ie-btn ie-btn--outline ie-btn--lg"
                          href={`${ROUTES.talk}?practiceId=${this.props.practiceId}`}
                        >
                          이음쌤에게 쪽지 쓰기
                        </A>{" "}
                        <button
                          type="button"
                          className="ie-btn ie-btn--outline ie-btn--lg"
                          onClick={v.rechoose}
                        >
                          되돌아가 다시 해 보기
                        </button>
                      </div>
                    </section>
                  ) : null}{" "}
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </>
    );
  }
}
