/**
 * T02 쪽지 모아 보기
 * (원본 디자인: TeacherMessages.dc.html)
 */
import { Component, Fragment } from "react";
import { teacherService } from "@/api";
import { A } from "@/lib/A";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import TeacherNav from "@/components/TeacherNav/TeacherNav";
import { queryId } from "@/lib/query";

export default class TeacherMessages extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      // 알림에서 특정 쪽지로 들어오면 답장 완료된 쪽지도 보이도록 전체로 시작합니다.
      // 필터: WAITING(답장이 필요해요) · ANSWERED(답장했어요) · all(전체)
      f: queryId("thread", (props.messages ?? []).map((m) => m.id)) ? "all" : "WAITING",
      // 답장을 보내면 이 쪽지를 "답장했어요"로 바꿔야 해서, 목록을 화면 state 로 들고 있어요.
      messages: props.messages ?? [],
      sel:
        queryId("thread", (props.messages ?? []).map((m) => m.id)) ??
        props.messages?.[0]?.id ??
        "t2",
      reply: "",
      tried: false,
      unsent: false,
      apiError: "",
    };
  }
  renderVals() {
    const s = this.state;
    const M: any = s.messages;
    // 서버가 준 순서를 그대로 둔 채 거르기만 해요.
    const list = M.filter(
      (m) => s.f === "all" || (s.f === "WAITING" ? m.need : !m.need),
    );
    const empty =
      s.f === "WAITING"
        ? ["답장이 필요한 쪽지가 없어요", "새 쪽지가 오면 여기에 보여요."]
        : s.f === "ANSWERED"
          ? ["답장한 쪽지가 없어요", "답장을 보내면 여기에 모여요."]
          : ["받은 쪽지가 없어요", "새 쪽지가 오면 여기에 보여요."];
    const cur = list.filter((m) => m.id === s.sel)[0] || null;
    const bad = s.tried && s.reply.trim() === "";
    const S = [
      "이야기해 줘서 고마워요.",
      "그런 일이 있었군요. 마음이 많이 쓰였겠어요.",
      "언제든 더 이야기해도 괜찮아요.",
    ];
    return {
      filters: [
        ["WAITING", "답장이 필요해요"],
        ["ANSWERED", "답장했어요"],
        ["all", "전체"],
      ].map((f) => ({
        label: f[1],
        on: s.f === f[0],
        pick: () => this.setState({ f: f[0], tried: false, unsent: false }),
      })),
      list: list.map((m) => ({
        nick: m.nick,
        date: m.date,
        scenario: m.scenario,
        preview: m.thread[m.thread.length - 1][2].slice(0, 26) + "…",
        status: m.need ? "답장이 필요해요" : "답장했어요",
        cls: m.need ? "ie-status ie-status--wait" : "ie-status ie-status--new",
        on: cur !== null && cur.id === m.id,
        pick: () => this.setState({ sel: m.id, reply: "", tried: false, unsent: false }),
      })),
      noList: list.length === 0,
      emptyTitle: empty[0],
      emptyText: empty[1],
      hasCur: cur !== null,
      cur: cur
        ? {
            nick: cur.nick,
            scenario: cur.scenario,
            picked: cur.picked,
            sig: cur.sig,
            // 신호 없음: 아무것도 안 띄워요 · OPEN: 경고 색 · HANDLED: 청록색
            hasSigLabel: cur.sig,
            sigLabel: cur.sigStatus === "HANDLED" ? "신호를 확인했어요" : "확인이 필요한 신호가 있어요",
            sigCls:
              cur.sigStatus === "HANDLED"
                ? "ie-status ie-status--done"
                : "ie-status ie-status--wait",
            thread: cur.thread.map((n) => ({
              cls: n[0] === "l" ? "ie-chat-row" : "ie-chat-row is-me",
              av: n[0] === "l" ? cur.nick.slice(0, 1) : "쌤",
              meta: n[1],
              text: n[2],
            })),
          }
        : { nick: "", scenario: "", picked: "", sig: false, hasSigLabel: false, sigLabel: "", sigCls: "", thread: [] },
      starters: S.map((x) => ({
        label: x,
        pick: () => this.setState({ reply: (s.reply ? s.reply + " " : "") + x, unsent: false }),
      })),
      reply: s.reply,
      replyCount: s.reply.length,
      rBad: bad,
      rCls: bad ? "ie-textarea is-error" : "ie-textarea",
      unsent: s.unsent,
      apiError: s.apiError,
      onReply: (e) => this.setState({ reply: e.target.value, unsent: false }),
      send: async () => {
        if (s.reply.trim() === "") {
          this.setState({ tried: true, unsent: false });
          return;
        }
        this.setState({ apiError: "" });
        try {
          const sent = await teacherService.sendReply(s.sel, s.reply);
          const threadId = sent?.threadId ?? s.sel;
          const entry = sent?.entry ?? ["t", "방금 · 내가 보낸 답장", s.reply];
          this.setState((prev) => ({
            // 서버가 쪽지를 ANSWERED 로 바꾸므로 화면도 "답장했어요"로 바꾸고, 보낸 답장을 대화에 붙여요.
            messages: prev.messages.map((m) =>
              m.id === threadId ? { ...m, need: false, thread: [...m.thread, entry] } : m,
            ),
            // "답장이 필요해요"만 보고 있었다면 방금 쪽지가 목록에서 사라져 안내가 안 보이니, "답장했어요"로 옮겨 줘요.
            f: prev.f === "WAITING" ? "ANSWERED" : prev.f,
            tried: false,
            reply: "",
            unsent: true,
          }));
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "답장을 보내지 못했어요.",
          });
        }
      },
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="tmsg" role="teacher" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <TeacherNav active="tmsg" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--lav ie-in" aria-labelledby="tm-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "600px" }}>
                <nav className="ie-crumb" aria-label="현재 위치">
                  <A href={ROUTES.teacher}>학습자</A>
                  <span aria-hidden="true">›</span>
                  <span>쪽지 모아 보기</span>
                </nav>
                <h1 id="tm-h" className="ie-title">
                  쪽지 모아 보기
                </h1>
                <p className="ie-body-lg ie-sub">
                  배정된 학습자들이 보낸 쪽지예요. 바로 답하지 못해도 괜찮아요. 급한 일은 쪽지로
                  기다리게 하지 말고 번호로 먼저 안내해요.
                </p>
              </div>
            </section>
            <div
              className="ie-alert ie-alert--warm"
              role="note"
              style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}
            >
              <span>
                <b>학습자가 위험해 보이면 쪽지에 답하기 전에 바로 연락하도록 안내해요.</b>
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
              </div>
            </div>
            <div className="ie-split">
              <section className="ie-stack-s" style={{ gap: "12px" }} aria-labelledby="tm-l">
                <h2 id="tm-l" className="ie-h3">
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
                            <b className="ie-body ie-strong">{m.nick}</b>
                            <span className={m.cls}>{m.status}</span>
                          </span>{" "}
                          <span className="ie-meta">
                            {m.date}
                            {" · "}
                            {m.scenario}
                          </span>
                          <span className="ie-body ie-sub">{m.preview}</span>
                        </button>
                      </li>
                    </Fragment>
                  ))}
                </ul>
                {v.noList ? (
                  <div className="ie-empty" role="status">
                    <b className="ie-h3">{v.emptyTitle}</b>
                    <p className="ie-body ie-sub">{v.emptyText}</p>
                  </div>
                ) : null}
              </section>
              {v.hasCur ? (
                <section className="ie-card" aria-labelledby="tm-d" style={{ gap: "18px" }}>
                  <div className="ie-row-between">
                    <h2 id="tm-d" className="ie-h2">
                      {v.cur.nick}
                      님의 쪽지
                    </h2>
                    {v.cur.hasSigLabel ? <span className={v.cur.sigCls}>{v.cur.sigLabel}</span> : null}
                  </div>
                  <div className="ie-card ie-card--flat" style={{ gap: "6px" }}>
                    <span className="ie-eyebrow">연결된 시나리오</span>
                    <b className="ie-body ie-strong">{v.cur.scenario}</b>
                    <span className="ie-body ie-sub">{v.cur.picked}</span>
                  </div>
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
                  <div className="ie-stack-s" style={{ gap: "8px" }}>
                    <span className="ie-label">첫 문장 도움</span>
                    <div className="ie-row">
                      {(v.starters || []).map((x: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <button type="button" className="ie-chip" onClick={x.pick}>
                            {x.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="tm-r">
                      {"답장 쓰기 "}
                      <span className="ie-req">필수</span>
                    </label>{" "}
                    <textarea
                      id="tm-r"
                      className={v.rCls}
                      maxLength={500}
                      style={{ minHeight: "120px" }}
                      value={v.reply}
                      onChange={v.onReply}
                      aria-invalid={v.rBad}
                      aria-describedby="tm-r-h"
                    />
                    <div className="ie-row-between">
                      <span id="tm-r-h" className="ie-help">
                        판단하거나 조언부터 하지 말고, 들은 것을 먼저 전해 주세요. 비밀을 무조건
                        지킨다고 약속하지 않아요.
                      </span>
                      <span className="ie-help">
                        {v.replyCount}
                        {" / 500"}
                      </span>
                    </div>
                    {v.rBad ? (
                      <span className="ie-error-text">답장 내용을 적어 주세요.</span>
                    ) : null}
                    {v.apiError ? (
                      <span className="ie-error-text" role="alert">
                        {v.apiError}
                      </span>
                    ) : null}
                  </div>
                  {v.unsent ? (
                    <div className="ie-alert ie-alert--ok" role="status">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#FFD6C1" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#94431F"
                        />
                      </svg>
                      <div>
                        <b>답장을 보냈어요.</b>
                      </div>
                    </div>
                  ) : null}
                  <div className="ie-row">
                    <button type="button" className="ie-btn ie-btn--primary" onClick={v.send}>
                      답장 보내기
                    </button>
                    <A className="ie-btn ie-btn--outline" href={ROUTES.teacher}>
                      학습자 기록 보기
                    </A>
                    {v.cur.sig ? (
                      <A className="ie-btn ie-btn--secondary" href={ROUTES.teacherSignal}>
                        신호 대응 기록
                      </A>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    );
  }
}
