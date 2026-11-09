/**
 * T03 신호 대응 기록
 * (원본 디자인: TeacherSignal.dc.html)
 */
import { Component, Fragment } from "react";
import { teacherService } from "@/api";
import { A } from "@/lib/A";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import TeacherNav from "@/components/TeacherNav/TeacherNav";

export default class TeacherSignal extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    const done = Object.fromEntries(
      (props.students ?? []).map((student) => [student.id, [student.handled ?? false]]),
    );
    const memos = Object.fromEntries(
      (props.students ?? []).map((student) => [student.id, student.memo ?? ""]),
    );
    this.state = {
      sel: props.students?.[0]?.id ?? "p2",
      done,
      memos,
      unsent: false,
      apiError: "",
    };
  }
  renderVals() {
    const s = this.state;
    const P: any = this.props.students;
    const ST: any = [
      [
        "대응했어요",
        "소속 기관의 절차에 따라 학습자를 살폈으면 체크해요. 다시 체크를 풀면 아직 안 했어요로 돌아가요.",
      ],
    ];
    const cur = P.find((p) => p.id === s.sel) ?? null;
    const d = cur ? s.done[cur.id] : [];
    return {
      people: P.map((p) => {
        const n = s.done[p.id].filter(Boolean).length;
        return {
          ava: "ie-ava ie-ava--" + (p.nick.charCodeAt(0) % 4),
          ini: p.nick.slice(0, 1),
          nick: p.nick,
          since: p.since,
          seen: p.seen,
          on: s.sel === p.id,
          label: n === 1 ? "했어요" : "아직 안 했어요",
          cls: n === 1 ? "ie-status ie-status--done" : "ie-status ie-status--new",
          pick: () => this.setState({ sel: p.id, unsent: false }),
        };
      }),
      hasCur: cur !== null,
      cur: cur
        ? { nick: cur.nick, msgDate: cur.msgDate, msgText: cur.msgText, word: cur.word }
        : null,
      steps: ST.map((x, i) => ({
        t: x[0],
        d: x[1],
        on: d[i],
        toggle: () => {
          const a = d.slice();
          a[i] = !a[i];
          this.setState({ done: Object.assign({}, s.done, { [cur.id]: a }), unsent: false });
        },
      })),
      memo: s.memos[cur.id] || "",
      unsent: s.unsent,
      onMemo: (e) =>
        this.setState({
          memos: Object.assign({}, s.memos, { [cur.id]: e.target.value }),
          unsent: false,
        }),
      apiError: s.apiError,
      save: async () => {
        if (!cur) return;
        this.setState({ apiError: "" });
        try {
          await teacherService.saveSignalRecord(cur.id, {
            done: s.done[cur.id],
            memo: s.memos[cur.id] || "",
          });
          this.setState({ unsent: true });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "대응 기록을 저장하지 못했어요.",
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
          <Header active="tsig" role="teacher" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <TeacherNav active="tsig" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--peach ie-in" aria-labelledby="ts-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "600px" }}>
                <nav className="ie-crumb" aria-label="현재 위치">
                  <A href={ROUTES.teacher}>학습자</A>
                  <span aria-hidden="true">›</span>
                  <span>신호 대응 기록</span>
                </nav>
                <h1 id="ts-h" className="ie-title">
                  신호 대응 기록
                </h1>
                <p className="ie-body-lg ie-sub">
                  확인이 필요한 신호가 나타난 학습자예요. 대응 기록은 정도로 나누지 않고, 했어요 ·
                  아직 안 했어요와 메모로만 남겨요.
                </p>
              </div>
            </section>
            <div className="ie-layout">
              <div className="ie-stack">
                <section className="ie-card" aria-labelledby="ts-l" style={{ gap: "14px" }}>
                  <h2 id="ts-l" className="ie-h2">
                    학습자
                  </h2>
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
                          <span className="ie-row" style={{ gap: "12px", flex: "1 1 200px" }}>
                            <span className="ie-dot" />
                            <span className={p.ava} aria-hidden="true">
                              {p.ini}
                            </span>
                            <span className="ie-stack-s" style={{ gap: "0" }}>
                              <b className="ie-strong">{p.nick}</b>
                              <span className="ie-meta">
                                {"배정 "}
                                {p.since}
                                {" · 신호 확인 "}
                                {p.seen}
                              </span>
                            </span>
                          </span>
                          <span className={p.cls}>{p.label}</span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                </section>
                {v.hasCur ? (
                <section className="ie-card" aria-labelledby="ts-d" style={{ gap: "18px" }}>
                  <div className="ie-row-between">
                    <h2 id="ts-d" className="ie-h2">
                      {v.cur.nick}님 대응 기록
                    </h2>
                    <span className="ie-status ie-status--wait">확인이 필요한 신호 있음</span>
                  </div>
                  <p className="ie-body ie-sub">
                    신호가 된 쪽지 문장은 아래에서 읽어 볼 수 있어요.
                  </p>
                  <div
                    className="ie-card ie-card--flat"
                    style={{ gap: "10px" }}
                    aria-labelledby="ts-msg"
                  >
                    <h3 id="ts-msg" className="ie-h3">
                      신호가 된 쪽지
                    </h3>
                    <div className="ie-row">
                      <span className="ie-meta">{v.cur.msgDate}</span>
                      <span className="ie-tag">
                        {"찾은 낱말 · "}
                        {v.cur.word}
                      </span>
                    </div>
                    <p className="ie-body-lg" style={{ margin: "0" }}>
                      “{v.cur.msgText}”
                    </p>
                    <p className="ie-help">
                      낱말이 우연히 들어간 말일 수도 있어요. 문장을 읽고 지금 마음이 어떤지 이음쌤이
                      직접 살펴 주세요.
                    </p>
                    <div className="ie-row">
                      <A
                        className="ie-btn ie-btn--secondary ie-btn--sm"
                        href={ROUTES.teacherMessages}
                      >
                        이 쪽지 열기
                      </A>
                    </div>
                  </div>
                  <div
                    className="ie-stack-s"
                    style={{ gap: "10px" }}
                    role="group"
                    aria-label="대응 단계"
                  >
                    {(v.steps || []).map((st: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          role="checkbox"
                          className="ie-option"
                          aria-checked={st.on}
                          onClick={st.toggle}
                        >
                          <span className="ie-box" />
                          <span className="ie-stack-s" style={{ gap: "2px" }}>
                            <b className="ie-strong">{st.t}</b>
                            <span className="ie-meta">{st.d}</span>
                          </span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="ts-m">
                      {"대응 메모 "}
                      <span className="ie-opt">선택</span>
                    </label>{" "}
                    <textarea
                      id="ts-m"
                      className="ie-textarea"
                      style={{ minHeight: "110px" }}
                      value={v.memo}
                      onChange={v.onMemo}
                      aria-describedby="ts-m-h"
                    />{" "}
                    <span id="ts-m-h" className="ie-help">
                      평가나 판단이 아니라 한 일과 본 것을 적어 주세요. 학습자에게는 보이지 않아요.
                    </span>
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
                        <b>대응 기록을 남겼어요.</b>
                      </div>
                    </div>
                  ) : null}
                  {v.apiError ? (
                    <p className="ie-error-text" role="alert">
                      {v.apiError}
                    </p>
                  ) : null}
                  <div className="ie-row">
                    <button type="button" className="ie-btn ie-btn--primary" onClick={v.save}>
                      대응 기록 남기기
                    </button>
                    <A className="ie-btn ie-btn--outline" href={ROUTES.teacherMessages}>
                      쪽지 보기
                    </A>
                    <A className="ie-btn ie-btn--text" href={ROUTES.teacher}>
                      학습자 기록 보기
                    </A>
                  </div>
                </section>
                ) : (
                  <section className="ie-card" role="status" style={{ gap: "12px" }}>
                    <h2 className="ie-h2">확인할 신호가 없어요</h2>
                    <p className="ie-body ie-sub">
                      새 신호가 확인되면 이곳에 표시돼요.
                    </p>
                  </section>
                )}
              </div>
              <aside className="ie-panel" aria-label="신호 대응 안내">
                <section className="ie-card ie-card--peach" style={{ gap: "12px" }}>
                  <h2 className="ie-h3">지금 위험해 보이면</h2>
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
                  <p className="ie-body">쪽지를 기다리지 말고 학습자에게 바로 번호를 안내해요.</p>
                </section>
                <section className="ie-card" style={{ gap: "12px" }} aria-labelledby="sg-std">
                  <h2 id="sg-std" className="ie-h3">
                    확인이 필요한 신호는 이렇게 정해져요
                  </h2>
                  <p className="ie-body ie-sub">
                    쪽지에 적은 말에서 아래 낱말이 보이면 신호로 표시돼요. 띄어쓰기나 특수문자를
                    넣어도 같은 낱말로 찾아요. 낱말만으로 위험하다고 단정하지 않아요. 사람이 내용을
                    확인하는 첫 단서예요.
                  </p>
                  <div className="ie-stack-s" style={{ gap: "6px" }}>
                    <p className="ie-body">
                      신호가 보이면 이 화면의 목록에 표시돼요. 쪽지 문장을 읽고 살펴 주세요.
                    </p>
                    <ul
                      className="ie-stack-s"
                      style={{ gap: "4px", listStyle: "disc", paddingLeft: "18px" }}
                    >
                      <li className="ie-body">자살 및 극단 선택 · 예: 죽고 싶다</li>
                      <li className="ie-body">자해 징후 · 예: 자해</li>
                      <li className="ie-body">성착취 및 그루밍 · 예: 조건 만남</li>
                      <li className="ie-body">가출 및 주거 불안 · 예: 가출</li>
                      <li className="ie-body">학교폭력 및 괴롭힘 · 예: 학폭</li>
                      <li className="ie-body">가정 내 폭력·학대 · 예: 집에 가기 싫다</li>
                      <li className="ie-body">불법 금융 및 비행 · 예: 대리입금</li>
                    </ul>
                  </div>
                </section>
                <section className="ie-card ie-card--lav" style={{ gap: "10px" }}>
                  <h2 className="ie-h3">이렇게 해 주세요</h2>
                  <ul
                    className="ie-stack-s"
                    style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                  >
                    <li className="ie-body">먼저 안부를 묻고 끝까지 들어요.</li>
                    <li className="ie-body">
                      혼자 해결하려 하지 말고 기관의 위기 대응 절차를 따라요.
                    </li>
                    <li className="ie-body">비밀을 무조건 지킨다고 약속하지 않아요.</li>
                    <li className="ie-body">
                      신호로 표시됐다는 것과 찾은 낱말은 학습자에게 말하지 않아요.
                    </li>
                    <li className="ie-body">
                      법에 따라 알려야 하는 경우가 있을 수 있어요. 어떤 경우인지는 학습자에게 미리
                      알려 둔 대로 안내해요.
                    </li>
                  </ul>
                </section>
              </aside>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
