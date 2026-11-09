/**
 * S12 내 쪽지함
 * (원본 디자인: Messages.dc.html)
 */
import { Component, Fragment } from "react";
import { messageService } from "@/api";
import { A } from "@/lib/A";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Messages.css?inline";

export default class Messages extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { f: "all", sel: "m3", add: "", tried: false, unsent: false };
  }
  renderVals() {
    const s = this.state;
    const M: any = this.props.messages;
    const ST: any = {
      wait: ["답변 대기", "ie-status ie-status--wait"],
      reply: ["답변 도착", "ie-status ie-status--reply"],
    };
    const list = M.filter((m) => s.f === "all" || m.st === s.f);
    const cur = list.filter((m) => m.id === s.sel)[0] || null;
    const addBad = s.tried && s.add.trim() === "";
    const steps = (m) =>
      m.st === "reply"
        ? [
            ["쪽지를 보냈어요", m.date.split(" 보냄")[0], "ie-tl-item is-done"],
            ["이음쌤이 읽었어요", "", "ie-tl-item is-done"],
            ["답변이 도착했어요", m.date.split("· ")[1], "ie-tl-item is-done"],
          ]
        : [
            ["쪽지를 보냈어요", m.date.replace(" 보냄", ""), "ie-tl-item is-done"],
            ["이음쌤이 확인하고 있어요", "바로 답이 오지 않을 수 있어요", "ie-tl-item is-now"],
            ["답변이 도착하면 알려요", "", "ie-tl-item"],
          ];
    return {
      filters: [
        ["all", "전체"],
        ["wait", "답변 대기"],
        ["reply", "답변 도착"],
      ].map((f) => ({
        label: f[1],
        on: s.f === f[0],
        pick: () => this.setState({ f: f[0], tried: false, unsent: false }),
      })),
      resetFilter: () => this.setState({ f: "all" }),
      list: list.map((m) => ({
        topic: m.topic,
        date: m.date,
        preview: m.thread[0][2].slice(0, 28) + (m.thread[0][2].length > 28 ? "…" : ""),
        status: ST[m.st][0],
        cls: ST[m.st][1],
        on: cur !== null && cur.id === m.id,
        pick: () => this.setState({ sel: m.id, add: "", tried: false, unsent: false }),
      })),
      noList: list.length === 0,
      hasCur: cur !== null,
      cur: cur
        ? {
            topic: cur.topic,
            status: ST[cur.st][0],
            cls: ST[cur.st][1],
            scenario: cur.scenario,
            hasScenario: cur.scenario !== "",
            waiting: cur.st === "wait",
            steps: steps(cur).map((x) => ({ t: x[0], d: x[1], cls: x[2] })),
            thread: cur.thread.map((n) => ({
              cls: n[0] === "l" ? "ie-chat-row is-me" : "ie-chat-row",
              av: n[0] === "l" ? "나" : "쌤",
              meta: n[1],
              text: n[2],
            })),
          }
        : {
            topic: "",
            status: "",
            cls: "",
            scenario: "",
            hasScenario: false,
            waiting: false,
            steps: [],
            thread: [],
          },
      add: s.add,
      addCount: s.add.length,
      addBad,
      addCls: addBad ? "ie-textarea is-error" : "ie-textarea",
      unsent: s.unsent,
      onAdd: (e) => this.setState({ add: e.target.value, unsent: false }),
      send: () => {
        if (s.add.trim() === "") {
          this.setState({ tried: true, unsent: false });
          return;
        }
        void messageService.sendFollowUp(s.sel, s.add);
        this.setState({ tried: false, add: "" });
      },
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="messages" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <SideNav active="messages" />
            </div>
            <main className="ie-main">
              <section className="ie-banner ie-banner--sky ie-in" aria-labelledby="ms-h">
                <span
                  className="ie-orb"
                  style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
                />
                <div className="ie-banner-text" style={{ maxWidth: "560px" }}>
                  <nav className="ie-crumb" aria-label="현재 위치">
                    <A href={ROUTES.talk}>이음상담소</A>
                    <span aria-hidden="true">›</span>
                    <span>내 쪽지함</span>
                  </nav>
                  <h1 id="ms-h" className="ie-title">
                    내 쪽지함
                  </h1>
                  <p className="ie-body-lg ie-sub">
                    이음쌤에게 보낸 쪽지와 답변을 모아 봐요. 답변은 바로 오지 않을 수 있어요.
                  </p>
                  <div className="ie-banner-actions">
                    <A className="ie-btn ie-btn--primary" href={ROUTES.talk}>
                      새 쪽지 쓰기
                    </A>
                  </div>
                </div>
                <div className="ie-banner-art ie-fade-l">
                  <img className="ie-3img" src={img.bannerMessages} alt="" draggable="false" />
                </div>
              </section>
              <div
                className="ie-alert ie-alert--warm"
                role="note"
                style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}
              >
                <span>
                  <b>급한 위험이라면 쪽지 답변을 기다리지 말고 바로 연락하세요.</b>
                </span>
                <div className="ie-emerg">
                  <div className="ie-emerg-item">
                    <b>112</b>
                    <span>지금 위험해요</span>
                  </div>
                  <div className="ie-emerg-item">
                    <b>1388</b>
                    <span>청소년 상담 · 365일 24시간</span>
                  </div>
                  <div className="ie-emerg-item">
                    <b>117</b>
                    <span>학교폭력·성폭력 신고</span>
                  </div>
                  <div className="ie-emerg-item">
                    <b>109</b>
                    <span>마음이 너무 힘들 때 상담</span>
                  </div>
                </div>
              </div>
              <div className="ie-split">
                <section aria-labelledby="ms-l" className="ie-stack-s" style={{ gap: "12px" }}>
                  <h2 id="ms-l" className="ie-h3">
                    쪽지 목록
                  </h2>
                  <div className="ie-row" role="group" aria-label="쪽지 거르기">
                    {(v.filters || []).map((f: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          className="ie-chip"
                          aria-pressed={f.on}
                          onClick={f.pick}
                        >
                          <span className="ie-box" />
                          {f.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <ul className="ie-stack-s" style={{ gap: "10px" }}>
                    {(v.list || []).map((m: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li>
                          <button
                            type="button"
                            className="ie-listrow"
                            aria-pressed={m.on}
                            onClick={m.pick}
                          >
                            <span className="ie-row-between">
                              <b className="ie-body ie-strong">{m.topic}</b>
                              <span className={m.cls}>{m.status}</span>
                            </span>{" "}
                            <span className="ie-meta">{m.date}</span>{" "}
                            <span className="ie-body ie-sub">{m.preview}</span>
                          </button>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                  {v.noList ? (
                    <div className="ie-empty" role="status">
                      <b className="ie-h3">해당하는 쪽지가 없어요</b>
                      <p className="ie-body ie-sub">
                        이야기하고 싶을 때 언제든 새 쪽지를 써도 돼요.
                      </p>
                      <button
                        type="button"
                        className="ie-btn ie-btn--secondary"
                        onClick={v.resetFilter}
                      >
                        전체 보기
                      </button>
                    </div>
                  ) : null}
                </section>
                {v.hasCur ? (
                  <section className="ie-card" aria-labelledby="ms-d" style={{ gap: "18px" }}>
                    <div className="ie-row-between">
                      <h2 id="ms-d" className="ie-h2">
                        {v.cur.topic}
                      </h2>
                      <span className={v.cur.cls}>{v.cur.status}</span>
                    </div>
                    <div className="ie-row">
                      <span className="ie-meta">담당: 푸른 이음쌤</span>
                      {v.cur.hasScenario ? (
                        <span className="ie-tag ie-tag--topic">
                          {"연결된 시나리오 · "}
                          {v.cur.scenario}
                        </span>
                      ) : null}
                    </div>
                    <ol className="ie-timeline" aria-label="쪽지 진행">
                      {(v.cur.steps || []).map((st: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <li className={st.cls}>
                            <span className="ie-tl-mark">
                              <span className="ie-tl-dot" />
                              <span className="ie-tl-line" />
                            </span>
                            <span className="ie-tl-body">
                              <b className="ie-body ie-strong">{st.t}</b>
                              <span className="ie-meta">{st.d}</span>
                            </span>
                          </li>
                        </Fragment>
                      ))}
                    </ol>
                    <ol className="ie-chat" aria-label="주고받은 쪽지">
                      {(v.cur.thread || []).map((n: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <li className={n.cls}>
                            <span className="ie-chat-av" aria-hidden="true">
                              {n.av}
                            </span>
                            <div className="ie-chat-b">
                              <p className="ie-body-lg">{n.text}</p>
                              <span className="ie-meta">{n.meta}</span>
                            </div>
                          </li>
                        </Fragment>
                      ))}
                    </ol>
                    {v.cur.waiting ? (
                      <div className="ie-alert ie-alert--info" role="status">
                        <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                          <path
                            d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                            fill="#BFDDFF"
                          />
                          <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                            fill="#2B5C96"
                          />
                        </svg>
                        <div>
                          <b>이음쌤이 확인하고 있어요.</b>
                          {
                            " 바로 답변이 오지 않을 수 있어요. 운영 시간: 평일·주말 09:00–18:00 (공휴일 제외)"
                          }
                        </div>
                      </div>
                    ) : null}
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="ms-add">
                        {"이어서 쪽지 쓰기 "}
                        <span className="ie-opt">선택</span>
                      </label>{" "}
                      <textarea
                        id="ms-add"
                        className={v.addCls}
                        maxLength={500}
                        style={{ minHeight: "96px" }}
                        value={v.add}
                        onChange={v.onAdd}
                      />
                      <div className="ie-row-between">
                        <span className="ie-help">한 줄만 적어도 괜찮아요.</span>
                        <span className="ie-help">
                          {v.addCount}
                          {" / 500"}
                        </span>
                      </div>
                      {v.addBad ? <span className="ie-error-text">내용을 적어 주세요.</span> : null}
                    </div>
                    <div className="ie-row">
                      <button type="button" className="ie-btn ie-btn--primary" onClick={v.send}>
                        쪽지 보내기
                      </button>
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
