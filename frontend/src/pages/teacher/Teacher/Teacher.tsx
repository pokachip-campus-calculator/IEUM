/**
 * T01 이음쌤 홈
 * (원본 디자인: Teacher.dc.html)
 */
import { Component, Fragment } from "react";
import { teacherService } from "@/api";
import { A } from "@/lib/A";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import TeacherNav from "@/components/TeacherNav/TeacherNav";
import { queryId } from "@/lib/query";

export default class Teacher extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      q: "",
      how: "all",
      sort: "nick",
      sel:
        queryId("student", (props.students ?? []).map((x) => x.id)) ??
        props.students?.[0]?.id ??
        "p2",
      tab: "sum",
      reply: "",
      replyTried: false,
      replyUnsent: false,
      replyError: "",
      memos: {},
      kept: {},
      help: false,
    };
  }
  renderVals() {
    const s = this.state;
    const P: any = this.props.students;
    const mk = (a, b) =>
      a === b
        ? ["같아요", "ie-status ie-status--doing"]
        : ["달라졌어요", "ie-status ie-status--done"];
    const needReply = (p) => p.notes.length > 0 && p.notes[p.notes.length - 1].from === "l";
    const dn = (t) => {
      const m = /(\d+)월 (\d+)일/.exec(t);
      return m ? Number(m[1]) * 100 + Number(m[2]) : 0;
    };
    const list = P.filter(
      (p) =>
        (s.how === "all" || (s.how === "sig" ? p.sig : !p.sig)) &&
        (s.q.trim() === "" || p.nick.indexOf(s.q.trim()) >= 0),
    ).sort((a, b) =>
      s.sort === "nick"
        ? a.nick < b.nick
          ? -1
          : 1
        : s.sort === "assigned"
          ? dn(b.since) - dn(a.since)
          : b.key - a.key,
    );
    const p = list.filter((x) => x.id === s.sel)[0] || null;
    const sigOf = (x) => ({
      sigLabel: x.sig ? "확인이 필요한 신호 있음" : "신호 없음",
      sigCls: x.sig ? "ie-status ie-status--wait" : "ie-status ie-status--new",
    });
    const TABS: any = [
      ["sum", "요약"],
      ["cmp", "질문지 비교"],
      ["emo", "감정 읽기"],
      ["note", "쪽지"],
    ];
    const replyBad = s.replyTried && s.reply.trim() === "";
    const out: any = {
      helpOpen: s.help,
      openHelp: () => this.setState({ help: true }),
      closeHelp: () => this.setState({ help: false }),
      sums: [
        {
          label: "배정된 학습자",
          value: (this.props.summary ? this.props.summary.studentCount : P.length) + "명",
          note: "쪽지를 보내면 배정돼요",
          cls: "ie-stat ie-stat--sky ie-pop",
        },
        {
          label: "답장이 필요한 쪽지",
          // 서버가 센 "답을 기다리는 쪽지" 수가 있으면 그 값을, 없으면 목록으로 계산해요
          value:
            (this.props.summary ? this.props.summary.waitingThreadCount : P.filter(needReply).length) + "건",
          note: "바로 답하지 못해도 괜찮아요",
          cls: "ie-stat ie-stat--lav ie-pop",
        },
        {
          label: "확인이 필요한 신호",
          value: P.filter((x) => x.sig).length + "명",
          note: "있음·없음만 보여요",
          cls: "ie-stat ie-stat--peach ie-pop",
        },
      ],
      listCount: list.length + "명",
      q: s.q,
      how: s.how,
      sort: s.sort,
      hows: [
        ["all", "전체"],
        ["note", "쪽지 신청"],
        ["sig", "신호로 배정"],
      ].map((o) => ({ value: o[0], label: o[1] })),
      sorts: [
        ["nick", "닉네임 순"],
        ["assigned", "최근 배정 순"],
        ["recent", "최근 활동 순"],
      ].map((o) => ({ value: o[0], label: o[1] })),
      onQ: (e) => this.setState({ q: e.target.value }),
      onHow: (e) => this.setState({ how: e.target.value }),
      onSort: (e) => this.setState({ sort: e.target.value }),
      resetFilter: () => this.setState({ q: "", how: "all" }),
      people: list.map((x) =>
        Object.assign(
          {
            ava: "ie-ava ie-ava--" + (x.nick.charCodeAt(0) % 4),
            ini: x.nick.slice(0, 1),
            nick: x.nick,
            how: x.how,
            last: x.last,
            on: p !== null && p.id === x.id,
            noteLabel: needReply(x)
              ? "답장이 필요해요"
              : x.notes.length
                ? "답장했어요"
                : "받은 쪽지 없음",
            noteCls: needReply(x) ? "ie-status ie-status--wait" : "ie-status ie-status--new",
            pick: () =>
              this.setState({
                sel: x.id,
                tab: "sum",
                reply: "",
                replyTried: false,
                replyUnsent: false,
              }),
          },
          sigOf(x),
        ),
      ),
      noPeople: list.length === 0,
      hasCur: p !== null,
      tabs: TABS.map((t) => ({
        label: t[1],
        on: s.tab === t[0],
        pick: () => this.setState({ tab: t[0], replyUnsent: false }),
      })),
      tab: {
        sum: s.tab === "sum",
        cmp: s.tab === "cmp",
        emo: s.tab === "emo",
        note: s.tab === "note",
        memo: s.tab === "memo",
      },
      reply: s.reply,
      replyCount: s.reply.length,
      replyBad,
      replyCls: replyBad ? "ie-textarea is-error" : "ie-textarea",
      replyUnsent: s.replyUnsent,
      replyError: s.replyError,
      onReply: (e) => this.setState({ reply: e.target.value, replyUnsent: false }),
      sendReply: async () => {
        if (s.reply.trim() === "") {
          this.setState({ replyTried: true, replyUnsent: false });
          return;
        }
        this.setState({ replyError: "" });
        try {
          await teacherService.sendReply(s.sel, s.reply);
          this.setState({ replyTried: false, reply: "", replyUnsent: true });
        } catch (error) {
          this.setState({
            replyError: error instanceof Error ? error.message : "답장을 보내지 못했어요.",
          });
        }
      },
      memo: p ? s.memos[p.id] || "" : "",
      kept: p ? !!s.kept[p.id] : false,
      onMemo: (e) =>
        this.setState({
          memos: Object.assign({}, s.memos, { [p.id]: e.target.value }),
          kept: Object.assign({}, s.kept, { [p.id]: false }),
        }),
      keep: () => {
        void teacherService.saveMemo(p.id, s.memos[p.id] || "");
        this.setState({ kept: Object.assign({}, s.kept, { [p.id]: true }) });
      },
    };
    out.cur = p
      ? Object.assign(
          {
            nick: p.nick,
            last: p.last,
            how: p.how,
            since: p.since,
            sig: p.sig,
            stampCount: p.stamps.length,
            stamps: p.stamps.map((t) => ({ name: t[0], date: t[1] })),
            unit: p.unit,
            clues: p.clues,
            guess: p.guess,
            hasNotes: p.notes.length > 0,
            noNotes: p.notes.length === 0,
            rows: p.rows.map((r) => {
              const m = mk(r[1], r[2]);
              return { q: r[0], a: r[1], b: r[2], mark: m[0], cls: m[1] };
            }),
            notes: p.notes.map((n) => ({
              cls: n.from === "l" ? "ie-chat-row" : "ie-chat-row is-me",
              av: n.from === "l" ? p.nick.slice(0, 1) : "쌤",
              meta:
                (n.from === "l" ? "받은 쪽지" : "내가 보낸 답장") +
                " · " +
                n.date +
                (n.sc ? " · 연결된 시나리오: " + n.sc : ""),
              text: n.text,
            })),
          },
          sigOf(p),
        )
      : {
          nick: "",
          last: "",
          how: "",
          since: "",
          sig: false,
          stampCount: 0,
          stamps: [],
          unit: "",
          clues: [],
          guess: [],
          hasNotes: false,
          noNotes: true,
          rows: [],
          notes: [],
          sigLabel: "",
          sigCls: "",
        };
    return out;
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="teacher" role="teacher" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <TeacherNav active="teacher" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--sky ie-in" aria-labelledby="th-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "600px" }}>
                <h1 id="th-h" className="ie-title">
                  이음쌤 화면
                </h1>
                <p className="ie-body-lg ie-sub">
                  점수나 순위, 위험도 해석 없이 활동 기록만 보여요. 학습자와 이야기를 시작하는
                  실마리로 써 주세요.
                </p>
                <div className="ie-banner-actions">
                  <A className="ie-btn ie-btn--primary" href={ROUTES.teacherUpload}>
                    강의 자료 올리기
                  </A>
                  <button
                    type="button"
                    className="ie-btn ie-btn--outline"
                    aria-haspopup="dialog"
                    onClick={v.openHelp}
                  >
                    <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
                      <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#BFDDFF" />
                      <path
                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-40a12,12,0,1,1-12-12A12,12,0,0,1,140,176Zm-4-28a8,8,0,0,1-16,0v-4a8,8,0,0,1,8-8,20,20,0,1,0-20-20,8,8,0,0,1-16,0,36,36,0,1,1,44,35.1Z"
                        fill="#2B5C96"
                      />
                    </svg>
                    도움말
                  </button>
                </div>
              </div>
            </section>
            <div className="ie-layout" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
              <div className="ie-stack">
                <section aria-label="한눈에 보기">
                  <div
                    className="ie-grid-auto"
                    style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(170px,100%),1fr))" }}
                  >
                    {(v.sums || []).map((m: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <div className={m.cls}>
                          <span className="ie-meta">{m.label}</span>
                          <b style={{ color: "var(--ie-action-ink)" }}>{m.value}</b>
                          <span className="ie-meta">{m.note}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
                <section className="ie-card" aria-labelledby="t-list" style={{ gap: "16px" }}>
                  <div className="ie-row-between">
                    <h2 id="t-list" className="ie-h2">
                      배정된 학습자
                    </h2>
                    <span className="ie-meta" aria-live="polite">
                      {v.listCount}
                    </span>
                  </div>
                  <div className="ie-row" style={{ gap: "12px", alignItems: "flex-end" }}>
                    <div className="ie-field" style={{ flex: "2 1 200px" }}>
                      <label className="ie-label" htmlFor="t-q">
                        닉네임 찾기
                      </label>
                      <input
                        id="t-q"
                        className="ie-input"
                        type="search"
                        value={v.q}
                        onChange={v.onQ}
                        placeholder="닉네임 일부를 적어요"
                      />
                    </div>
                    <div className="ie-field" style={{ flex: "1 1 160px" }}>
                      <label className="ie-label" htmlFor="t-sort">
                        정렬
                      </label>{" "}
                      <select id="t-sort" className="ie-select" value={v.sort} onChange={v.onSort}>
                        {(v.sorts || []).map((o: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <option value={o.value}>{o.label}</option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div
                    className="ie-stack-s"
                    style={{ gap: "10px" }}
                    role="radiogroup"
                    aria-label="학습자 선택"
                  >
                    {(v.people || []).map((p: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          role="radio"
                          className="ie-option"
                          aria-checked={p.on}
                          onClick={p.pick}
                          style={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                          }}
                        >
                          <span className="ie-row" style={{ gap: "12px", flex: "1 1 220px" }}>
                            <span className="ie-dot" />
                            <span className={p.ava} aria-hidden="true">
                              {p.ini}
                            </span>
                            <span className="ie-stack-s" style={{ gap: "0" }}>
                              <b className="ie-strong">{p.nick}</b>
                              <span className="ie-meta">
                                {"최근 활동 "}
                                {p.last}
                              </span>
                            </span>
                          </span>{" "}
                          <span className="ie-row" style={{ gap: "8px" }}>
                            <span className={p.noteCls}>{p.noteLabel}</span>
                            <span className={p.sigCls}>{p.sigLabel}</span>
                          </span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  {v.noPeople ? (
                    <div className="ie-empty" role="status">
                      <b className="ie-h3">찾는 학습자가 없어요</b>
                      <p className="ie-body ie-sub">닉네임이나 배정 방식을 바꿔 보세요.</p>
                      <button
                        type="button"
                        className="ie-btn ie-btn--secondary"
                        onClick={v.resetFilter}
                      >
                        조건 지우기
                      </button>
                    </div>
                  ) : null}
                  <p className="ie-help">
                    활동이 많고 적음으로 줄을 세우지 않아요. 정렬은 닉네임이나 날짜 기준이에요.
                  </p>
                </section>
                {v.hasCur ? (
                  <section className="ie-card" aria-labelledby="t-det" style={{ gap: "18px" }}>
                    <div className="ie-row-between">
                      <h2 id="t-det" className="ie-h2">
                        {v.cur.nick}
                        님의 기록
                      </h2>
                      <span className={v.cur.sigCls}>{v.cur.sigLabel}</span>
                    </div>
                    <div className="ie-seg" role="tablist" aria-label="기록 보기">
                      {(v.tabs || []).map((t: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <button type="button" role="tab" aria-selected={t.on} onClick={t.pick}>
                            {t.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    {v.tab.sum ? (
                      <div
                        role="tabpanel"
                        className="ie-stack"
                        style={{ gap: "18px" }}
                        aria-label="요약"
                      >
                        <div className="ie-grid-2">
                          <div className="ie-card ie-card--flat" style={{ gap: "4px" }}>
                            <span className="ie-meta">최근 활동</span>
                            <b className="ie-body ie-strong">{v.cur.last}</b>
                          </div>
                          <div className="ie-card ie-card--flat" style={{ gap: "4px" }}>
                            <span className="ie-meta">배정된 날</span>
                            <b className="ie-body ie-strong">{v.cur.since}</b>
                          </div>
                        </div>
                        <div className="ie-stack-s">
                          <b className="ie-h3">
                            {"했어요 "}
                            {v.cur.stampCount}개
                          </b>
                          <ul className="ie-stack-s" style={{ gap: "8px" }}>
                            {(v.cur.stamps || []).map((t: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <li
                                  className="ie-row-between ie-card ie-card--flat"
                                  style={{ flexDirection: "row", padding: "10px 14px" }}
                                >
                                  <span className="ie-body">{t.name}</span>
                                  <span className="ie-meta">{t.date}</span>
                                </li>
                              </Fragment>
                            ))}
                          </ul>
                        </div>
                        {v.cur.sig ? (
                          <div
                            className="ie-card ie-card--peach"
                            role="region"
                            aria-label="확인이 필요한 신호가 있을 때"
                            style={{ gap: "12px" }}
                          >
                            <div className="ie-row-between">
                              <h3 className="ie-h3">확인이 필요한 신호가 있어요</h3>
                              <A
                                className="ie-btn ie-btn--secondary ie-btn--sm"
                                href={ROUTES.teacherSignal}
                              >
                                대응 기록 열기
                              </A>
                            </div>
                            <ol
                              className="ie-stack-s ie-body"
                              style={{ gap: "6px", listStyle: "decimal", paddingLeft: "20px" }}
                            >
                              <li>먼저 안부를 묻고, 학습자의 이야기를 끝까지 들어요.</li>
                              <li>혼자 해결하려 하지 말고, 기관의 위기 대응 절차를 따라요.</li>
                              <li>
                                법에 따라 알려야 하는 경우가 있을 수 있어요. 어떤 경우인지는
                                학습자에게 미리 알려 둔 대로 안내해요.
                              </li>
                              <li>
                                지금 위험해 보이면 쪽지를 기다리지 말고 바로 아래 번호로 연락해요.
                              </li>
                            </ol>
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
                        ) : null}
                      </div>
                    ) : null}{" "}
                    {v.tab.cmp ? (
                      <div role="tabpanel" className="ie-stack-s" aria-label="질문지 비교">
                        <b className="ie-h3">
                          {"사전·사후 질문지 비교 · "}
                          {v.cur.unit}
                        </b>
                        <table className="ie-table">
                          <thead>
                            <tr>
                              <th scope="col">문항</th>
                              <th scope="col">그때</th>
                              <th scope="col">지금</th>
                              <th scope="col">표시</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(v.cur.rows || []).map((r: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <tr>
                                  <td>{r.q}</td>
                                  <td>{r.a}</td>
                                  <td>{r.b}</td>
                                  <td>
                                    <span className={r.cls}>{r.mark}</span>
                                  </td>
                                </tr>
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                        <p className="ie-help">
                          달라졌는지, 같은지만 보여요. 점수로 바꾸거나 좋고 나쁨으로 읽지 않아요.
                        </p>
                      </div>
                    ) : null}{" "}
                    {v.tab.emo ? (
                      <div
                        role="tabpanel"
                        className="ie-stack"
                        style={{ gap: "16px" }}
                        aria-label="감정 읽기"
                      >
                        <div className="ie-grid-2">
                          <div className="ie-card ie-card--sky" style={{ gap: "10px" }}>
                            <b className="ie-body ie-strong">관찰한 사실로 고른 단서</b>
                            <div className="ie-row">
                              {(v.cur.clues || []).map((x: any, __i0: number) => (
                                <Fragment key={__i0}>
                                  <span className="ie-tag ie-tag--topic">{x}</span>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <div className="ie-card ie-card--lav" style={{ gap: "10px" }}>
                            <b className="ie-body ie-strong">짐작한 마음</b>
                            <div className="ie-row">
                              {(v.cur.guess || []).map((x: any, __i0: number) => (
                                <Fragment key={__i0}>
                                  <span className="ie-tag ie-tag--emotion">{x}</span>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="ie-help">
                          정답이 없는 활동이에요. 고른 단서와 마음은 이야기를 나누는 실마리로만
                          써요.
                        </p>
                      </div>
                    ) : null}{" "}
                    {v.tab.note ? (
                      <div
                        role="tabpanel"
                        className="ie-stack"
                        style={{ gap: "16px" }}
                        aria-label="쪽지"
                      >
                        {v.cur.hasNotes ? (
                          <ol className="ie-chat">
                            {(v.cur.notes || []).map((n: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <li className={n.cls}>
                                  <span className="ie-chat-av" aria-hidden="true">
                                    {n.av}
                                  </span>
                                  <div className="ie-chat-b">
                                    <p className="ie-body">{n.text}</p>
                                    <span className="ie-meta">{n.meta}</span>
                                  </div>
                                </li>
                              </Fragment>
                            ))}
                          </ol>
                        ) : null}{" "}
                        {v.cur.noNotes ? (
                          <div className="ie-empty" role="status">
                            <b className="ie-h3">아직 받은 쪽지가 없어요</b>
                            <p className="ie-body ie-sub">
                              쪽지가 오면 연결된 시나리오와 함께 여기에 보여요.
                            </p>
                          </div>
                        ) : null}
                        <div className="ie-field">
                          <label className="ie-label" htmlFor="t-reply">
                            {"답장 쓰기 "}
                            <span className="ie-opt">선택</span>
                          </label>{" "}
                          <textarea
                            id="t-reply"
                            className={v.replyCls}
                            maxLength={500}
                            style={{ minHeight: "110px" }}
                            value={v.reply}
                            onChange={v.onReply}
                            aria-describedby="t-reply-h"
                          />
                          <div className="ie-row-between">
                            <span id="t-reply-h" className="ie-help">
                              판단하거나 조언부터 하지 말고, 들은 것을 먼저 전해 주세요. 바로 답이
                              오지 않아도 괜찮다고 알려 줘요.
                            </span>
                            <span className="ie-help">
                              {v.replyCount}
                              {" / 500"}
                            </span>
                          </div>
                          {v.replyBad ? (
                            <span className="ie-error-text">답장 내용을 적어 주세요.</span>
                          ) : null}
                          {v.replyError ? (
                            <span className="ie-error-text" role="alert">
                              {v.replyError}
                            </span>
                          ) : null}
                        </div>
                        <div className="ie-row">
                          <button
                            type="button"
                            className="ie-btn ie-btn--primary"
                            onClick={v.sendReply}
                          >
                            답장 보내기
                          </button>
                          <A className="ie-btn ie-btn--outline" href={ROUTES.teacherMessages}>
                            쪽지 모아 보기
                          </A>
                        </div>
                        {v.replyUnsent ? (
                          <div className="ie-alert ie-alert--ok" role="status">
                            <div>
                              <b>답장을 보냈어요.</b>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            </div>
          </main>
        </div>
        {v.helpOpen ? (
          <div
            style={{
              position: "fixed",
              left: "0",
              top: "0",
              right: "0",
              bottom: "0",
              zIndex: "3000",
              display: "grid",
              placeItems: "center",
              padding: "20px",
              background: "rgba(40,51,76,.48)",
            }}
          >
            <div
              className="ie-card ie-pop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hp-t"
              style={{
                width: "100%",
                maxWidth: "760px",
                maxHeight: "calc(100% - 8px)",
                overflowY: "auto",
                gap: "16px",
                padding: "24px 26px",
              }}
            >
              <div className="ie-row-between">
                <h2 id="hp-t" className="ie-h2">
                  이음쌤 도움말
                </h2>
                <button type="button" className="ie-btn ie-btn--text" onClick={v.closeHelp}>
                  닫기
                </button>
              </div>
              <div className="ie-grid-2" style={{ alignItems: "start" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" }}
                >
                  <section
                    className="ie-card ie-card--sky"
                    aria-labelledby="hp-up"
                    style={{ gap: "10px" }}
                  >
                    <h3 id="hp-up" className="ie-h3">
                      강의 자료
                    </h3>
                    <p className="ie-body">
                      학습 카드(사진·파일)와 영상을 올려요. 올린 자료는 고른 영역과 단계의 학습에
                      들어가요.
                    </p>
                    <div className="ie-row">
                      <A
                        className="ie-btn ie-btn--secondary ie-btn--sm"
                        href={ROUTES.teacherUpload}
                      >
                        강의 자료 올리기
                      </A>
                    </div>
                  </section>
                  <section className="ie-card ie-card--lav" style={{ gap: "10px" }}>
                    <h3 className="ie-h3">배정과 응답</h3>
                    <p className="ie-body">
                      학습자가 처음 쪽지를 보내면, 맡은 학습자가 가장 적은 이음쌤에게 자동으로
                      배정돼요. 이음쌤이 없어도 학습자는 서비스를 끝까지 쓸 수 있어요.
                    </p>
                    <p className="ie-body">
                      {"응답 시간은 "}
                      <b>평일·주말 09:00–18:00 (공휴일 제외)</b>
                      이에요. 이 시간 밖에는 쪽지를 바로 확인하지 못해요.
                    </p>
                  </section>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" }}
                >
                  <section className="ie-card ie-card--mint" style={{ gap: "10px" }}>
                    <h3 className="ie-h3">볼 수 있는 것</h3>
                    <ul
                      className="ie-stack-s"
                      style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                    >
                      <li className="ie-body">질문지 응답과 비교 결과</li>
                      <li className="ie-body">했어요로 남긴 연습과 날짜</li>
                      <li className="ie-body">감정 읽기에서 고른 단서와 마음</li>
                      <li className="ie-body">받은 쪽지와 연결된 시나리오</li>
                      <li className="ie-body">확인이 필요한 신호 여부 (있음·없음만)</li>
                    </ul>
                  </section>
                  <section className="ie-card ie-card--peach" style={{ gap: "10px" }}>
                    <h3 className="ie-h3">볼 수 없는 것</h3>
                    <ul
                      className="ie-stack-s"
                      style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                    >
                      <li className="ie-body">학습자가 남긴 한 줄 메모</li>
                    </ul>
                  </section>
                </div>
              </div>
              <section className="ie-card ie-card--flat" style={{ gap: "10px" }}>
                <h3 className="ie-h3">이렇게 이야기해 보세요</h3>
                <ul
                  className="ie-stack-s"
                  style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                >
                  <li className="ie-body">“이야기해 줘서 고마워요.”처럼 먼저 받아 주세요.</li>
                  <li className="ie-body">비밀을 무조건 지킨다고 약속하지 않아요.</li>
                  <li className="ie-body">급한 일은 쪽지로 기다리게 하지 말고 번호로 안내해요.</li>
                </ul>
              </section>
              <div className="ie-row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="ie-btn ie-btn--primary" onClick={v.closeHelp}>
                  확인했어요
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
