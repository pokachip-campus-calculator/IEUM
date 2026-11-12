/**
 * S15 알림 (학습자·이음쌤 공용)
 * (원본 디자인: Notifications.dc.html)
 */
import { Component, Fragment } from "react";
import { notificationService, session, teacherService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import TeacherNav from "@/components/TeacherNav/TeacherNav";

/** 이관 신청 카드는 안에 버튼이 있어서 링크(<a>) 대신 div로 그려요. */
function NotiCard({ asDiv, href, className, onClick, children }: any) {
  return asDiv ? (
    <div className={className}>{children}</div>
  ) : (
    <A className={className} href={href} onClick={onClick}>
      {children}
    </A>
  );
}

export default class Notifications extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      role: session.user.role,
      f: "all",
      read: {},
      accepted: {},
      closed: {},
      apiError: "",
    };
  }
  renderVals() {
    const s = this.state;
    const D: any = this.props.notifications;
    const KINDS: any = {
      learner: [
        ["1", "답장이 도착했어요", "이음쌤이 내 쪽지에 답하면 알려 줘요."],
        ["2", "쪽지를 읽었어요", "이음쌤이 쪽지를 읽으면 알려 줘요."],
        ["3", "이음쌤이 배정됐어요", "쪽지를 보내면 이음쌤이 정해져요."],
      ],
      teacher: [
        ["1", "새 쪽지가 왔어요", "배정된 학습자가 쪽지를 보내면 알려 줘요."],
        ["2", "확인이 필요한 신호", "쪽지에서 신호가 보이면 알려 줘요. 있음·없음만 알려요."],
        ["3", "새 학습자가 배정됐어요", "새로 맡게 된 학습자를 알려 줘요."],
      ],
    };
    const isRead = (n) => !n.unread || s.read[n.id] === true;
    const all = D[s.role];
    const unreadCount = all.filter((n) => !isRead(n)).length;
    const list = all.filter((n) => s.f === "all" || !isRead(n));
    const ICO: any = { reply: "reply", msg: "msg", signal: "signal", done: "done" };
    return {
      sub:
        s.role === "learner"
          ? "이음쌤의 답장과 쪽지 소식을 여기에서 알려 줘요."
          : "새 쪽지와 확인이 필요한 신호를 여기에서 알려 줘요.",
      unreadCount,
      apiError: s.apiError,
      hasUnread: unreadCount > 0,
      noUnread: unreadCount === 0,
      filters: [
        ["all", "전체 " + all.length + "개"],
        ["unread", "안 읽음 " + unreadCount + "개"],
      ].map((f) => ({ label: f[1], on: s.f === f[0], pick: () => this.setState({ f: f[0] }) })),
      readAll: async () => {
        const m: any = {};
        all.forEach((n) => {
          m[n.id] = true;
        });
        this.setState({ apiError: "" });
        try {
          await notificationService.markRead(Object.keys(m));
          this.setState({ read: Object.assign({}, s.read, m) });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "알림을 읽음 처리하지 못했어요.",
          });
        }
      },
      showAll: () => this.setState({ f: "all" }),
      isLearner: s.role === "learner",
      isTeacher: s.role === "teacher",
      kinds: KINDS[s.role].map((k) => ({ n: k[0], t: k[1], d: k[2] })),
      hasList: list.length > 0,
      noList: list.length === 0,
      list: list.map((n, i) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        when: n.when,
        href: n.href,
        unread: !isRead(n),
        group: n.group,
        showGroup: i === 0 || list[i - 1].group !== n.group,
        cls: isRead(n) ? "ie-noti is-read" : "ie-noti is-unread",
        icoCls: "ie-noti-ico ie-noti-ico--" + ICO[n.type],
        isReply: n.type === "reply",
        isMsg: n.type === "msg",
        isSig: n.type === "signal",
        isDone: n.type === "done",
        isTransfer: n.transferId !== undefined,
        // 서버가 준 신청 상태(transferStatus)로 정해요. 상태가 없으면(옛 서버) 수락 가능으로 봐요.
        canAccept:
          n.transferId !== undefined &&
          (n.transferStatus === undefined || n.transferStatus === "PENDING") &&
          s.accepted[n.id] !== true &&
          s.closed[n.id] !== true,
        didAccept:
          n.transferId !== undefined &&
          (n.transferStatus === "ACCEPTED" || s.accepted[n.id] === true),
        didExpire:
          n.transferId !== undefined &&
          s.accepted[n.id] !== true &&
          (n.transferStatus === "EXPIRED" || s.closed[n.id] === true),
        accept: async () => {
          this.setState({ apiError: "" });
          try {
            await teacherService.acceptTransfer(n.transferId);
            await notificationService.markRead([n.id]);
            this.setState({
              accepted: Object.assign({}, s.accepted, { [n.id]: true }),
              read: Object.assign({}, s.read, { [n.id]: true }),
            });
          } catch (error) {
            // 이미 처리된 신청(409)이면 다시 눌러도 소용없으니 버튼을 없애요.
            const handled = (error as { status?: number })?.status === 409;
            this.setState({
              apiError: error instanceof Error ? error.message : "이관을 수락하지 못했어요.",
              closed: handled ? Object.assign({}, s.closed, { [n.id]: true }) : s.closed,
            });
          }
        },
        read: async () => {
          this.setState({ apiError: "" });
          try {
            await notificationService.markRead([n.id]);
            this.setState({ read: Object.assign({}, s.read, { [n.id]: true }) });
          } catch (error) {
            this.setState({
              apiError: error instanceof Error ? error.message : "알림을 읽음 처리하지 못했어요.",
            });
          }
        },
      })),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          {v.isLearner ? <Header active="noti" /> : null}
          {v.isTeacher ? <Header active="noti" role="teacher" /> : null}
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            {v.isLearner ? <SideNav active="noti" /> : null}
            {v.isTeacher ? <TeacherNav active="noti" /> : null}
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--peach ie-in" aria-labelledby="nt-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "560px" }}>
                <h1 id="nt-h" className="ie-title">
                  알림
                </h1>
                <p className="ie-body-lg ie-sub">{v.sub}</p>
                <div className="ie-banner-actions">
                  {v.hasUnread ? (
                    <span className="ie-newdot">
                      <span>
                        {"안 읽은 알림 "}
                        {v.unreadCount}개
                      </span>
                    </span>
                  ) : null}
                  {v.noUnread ? (
                    <span className="ie-status ie-status--done">모두 읽었어요</span>
                  ) : null}
                </div>
              </div>
              <div className="ie-banner-art ie-fade-l">
                <img className="ie-3img" src={img.bannerNotifications} alt="" draggable="false" />
              </div>
            </section>
            <div className="ie-twocol">
              <div className="ie-stack">
                <section
                  className="ie-toolbar ie-in"
                  style={{ "--d": "1" } as CSSProperties}
                  aria-label="알림 거르기"
                >
                  <div className="ie-fgroup" role="group" aria-label="알림 거르기">
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
                  <button
                    type="button"
                    className="ie-btn ie-btn--outline ie-btn--sm"
                    style={{ marginLeft: "auto" }}
                    aria-disabled={v.noUnread}
                    onClick={v.readAll}
                  >
                    모두 읽음으로 표시
                  </button>
                </section>
                {v.apiError ? (
                  <p className="ie-error-text" role="alert">
                    {v.apiError}
                  </p>
                ) : null}
                {v.hasList ? (
                  <ul className="ie-notilist" aria-label="알림 목록">
                    {(v.list || []).map((n: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li>
                          {n.showGroup ? <h2 className="ie-noti-group">{n.group}</h2> : null}{" "}
                          <NotiCard
                            asDiv={n.isTransfer}
                            className={n.cls}
                            href={n.href}
                            onClick={n.read}
                          >
                            <span className={n.icoCls} aria-hidden="true">
                              {n.isReply ? (
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="28"
                                    y="44"
                                    width="200"
                                    height="140"
                                    rx="44"
                                    fill="#B7A5F0"
                                  />
                                  <path d="M84 184 L70 226 L128 184Z" fill="#B7A5F0" />
                                  <path
                                    d="M128 150 C100 132 82 116 82 96 A24 24 0 0 1 128 88 A24 24 0 0 1 174 96 C174 116 156 132 128 150Z"
                                    fill="#FFFFFF"
                                  />
                                </svg>
                              ) : null}
                              {n.isMsg ? (
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="28"
                                    y="52"
                                    width="200"
                                    height="152"
                                    rx="30"
                                    fill="#8DBFF3"
                                  />
                                  <path
                                    d="M44 88 L128 148 L212 88"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : null}
                              {n.isSig ? (
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="52"
                                    y="30"
                                    width="16"
                                    height="196"
                                    rx="8"
                                    fill="#E0825C"
                                  />
                                  <path d="M68 44 H210 L176 96 L210 148 H68Z" fill="#F4A68C" />
                                </svg>
                              ) : null}
                              {n.isDone ? (
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <circle cx="128" cy="128" r="100" fill="#7CCBAE" />
                                  <path
                                    d="M82 134 L114 166 L176 92"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="18"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : null}
                            </span>{" "}
                            <span className="ie-noti-body">
                              <span className="ie-row-between" style={{ gap: "10px" }}>
                                <b className="ie-body ie-strong">{n.title}</b>
                                {n.unread ? <span className="ie-newdot">새 알림</span> : null}
                              </span>
                              <span className="ie-body ie-sub">{n.body}</span>
                              <span className="ie-meta">{n.when}</span>
                              {n.canAccept ? (
                                <span className="ie-row" style={{ gap: "10px", marginTop: "6px" }}>
                                  <button
                                    type="button"
                                    className="ie-btn ie-btn--primary ie-btn--sm"
                                    onClick={n.accept}
                                  >
                                    이관 수락하기
                                  </button>
                                  <span className="ie-help">
                                    수락하면 이 학습자를 내가 맡게 돼요.
                                  </span>
                                </span>
                              ) : null}
                              {n.didAccept ? (
                                <span
                                  className="ie-help"
                                  role="status"
                                  style={{ marginTop: "6px" }}
                                >
                                  수락했어요. 이제 이 학습자를 내가 맡아요.
                                </span>
                              ) : null}
                              {n.didExpire ? (
                                <span
                                  className="ie-help"
                                  role="status"
                                  style={{ marginTop: "6px" }}
                                >
                                  더 이상 수락할 수 없는 신청이에요.
                                </span>
                              ) : null}
                            </span>{" "}
                            {n.isTransfer ? null : (
                              <span className="ie-noti-go" aria-hidden="true">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M96 48 L176 128 L96 208"
                                    fill="none"
                                    stroke="#4E3FA6"
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            )}
                          </NotiCard>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                ) : null}{" "}
                {v.noList ? (
                  <div className="ie-empty ie-notiempty ie-pop" role="status">
                    <svg
                      className="ie-bellbig"
                      width="48"
                      height="48"
                      viewBox="0 0 256 256"
                      aria-hidden="true"
                    >
                      <path
                        d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                        fill="#D9CFFF"
                      />
                      <path
                        d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                        fill="#4E3FA6"
                      />
                    </svg>
                    <b className="ie-h3">새 알림이 없어요</b>
                    <p className="ie-body ie-sub">
                      새 소식이 생기면 여기와 위쪽 종 아이콘으로 알려 줘요.
                    </p>
                    <button type="button" className="ie-btn ie-btn--secondary" onClick={v.showAll}>
                      전체 보기
                    </button>
                  </div>
                ) : null}
              </div>
              <aside aria-label="알림 안내">
                <section
                  className="ie-card ie-card--lav ie-pop"
                  style={{ gap: "12px", "--d": "2" } as CSSProperties}
                  aria-labelledby="nt-what"
                >
                  <h2 id="nt-what" className="ie-h3">
                    어떤 알림이 오나요?
                  </h2>
                  <ul className="ie-tips">
                    {(v.kinds || []).map((k: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li>
                          <span className="ie-tips-n" aria-hidden="true">
                            {k.n}
                          </span>
                          <span className="ie-body">
                            <b>{k.t}</b>
                            <br />
                            {k.d}
                          </span>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                </section>
                <section
                  className="ie-card ie-card--mint ie-pop"
                  style={{ gap: "10px", "--d": "3" } as CSSProperties}
                  aria-labelledby="nt-priv"
                >
                  <h2 id="nt-priv" className="ie-h3">
                    알림은 이렇게 다뤄요
                  </h2>
                  <ul className="ie-stack-s ie-body" style={{ gap: "8px" }}>
                    <li>· 알림에는 쪽지 내용이나 찾은 낱말을 담지 않아요.</li>
                    <li>· 이 화면과 종 아이콘에서만 보여요. 문자나 이메일로 보내지 않아요.</li>
                    <li>
                      · 확인이 필요한 신호 알림은 이음쌤에게만 가요. 학습자에게는 가지 않아요.
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
