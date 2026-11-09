/**
 * S14 내 정보
 * (원본 디자인: Profile.dc.html)
 */
import { Component, Fragment } from "react";
import { clearSessionUser, profileService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";

export default class Profile extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      loginId: props.profile?.loginId ?? "",
      teacher: props.profile?.teacher ?? null,
      nick: props.profile?.nick ?? "",
      mail: props.profile?.mail ?? "",
      pwCur: "",
      pwNew: "",
      pwNew2: "",
      basicTried: false,
      pwTried: false,
      pwError: "",
      pwSaving: false,
      basicUnsent: false,
      pwUnsent: false,
      notif: props.profile?.notifications ?? [true, true, false],
      outOpen: false,
      outAgree: false,
      outTried: false,
      outSaving: false,
      outError: "",
    };
  }
  renderVals() {
    const s = this.state;
    const cls = (b) => (b ? "ie-input is-error" : "ie-input");
    const nickBad = s.basicTried && s.nick.trim() === "";
    const pwCurrentError = s.pwError.includes("현재 비밀번호");
    const curBad = (s.pwTried && s.pwCur === "") || pwCurrentError,
      newBad = s.pwTried && s.pwNew.length < 8,
      new2Bad = s.pwTried && s.pwNew !== s.pwNew2;
    const N: any = [
      ["답변이 도착하면", "이음쌤 답장이 오면 알려요"],
      ["이어서 할 연습이 있으면", "하는 중인 연습을 알려요"],
      ["새 연습이 열리면", "다음에 열려요 단계가 열릴 때 알려요"],
    ];
    return {
      loginId: s.loginId,
      teacher: s.teacher,
      nick: s.nick,
      mail: s.mail,
      nickBad,
      nickCls: cls(nickBad),
      curBad,
      newBad,
      new2Bad,
      curCls: cls(curBad),
      newCls: cls(newBad),
      new2Cls: cls(new2Bad),
      pwCur: s.pwCur,
      pwNew: s.pwNew,
      pwNew2: s.pwNew2,
      pwError: s.pwError,
      pwCurrentError,
      pwSaving: s.pwSaving,
      basicUnsent: s.basicUnsent,
      pwUnsent: s.pwUnsent,
      outUnsent: s.outUnsent,
      onNick: (e) => this.setState({ nick: e.target.value, basicUnsent: false }),
      onMail: (e) => this.setState({ mail: e.target.value, basicUnsent: false }),
      onPwCur: (e) => this.setState({ pwCur: e.target.value, pwUnsent: false, pwError: "" }),
      onPwNew: (e) => this.setState({ pwNew: e.target.value, pwUnsent: false, pwError: "" }),
      onPwNew2: (e) => this.setState({ pwNew2: e.target.value, pwUnsent: false, pwError: "" }),
      saveBasic: () => {
        if (s.nick.trim() === "") {
          this.setState({ basicTried: true, basicUnsent: false });
          return;
        }
        void profileService.updateProfile({ nick: s.nick, mail: s.mail });
        this.setState({ basicTried: false, basicUnsent: true });
      },
      savePw: async () => {
        if (s.pwCur === "" || s.pwNew.length < 8 || s.pwNew !== s.pwNew2) {
          this.setState({ pwTried: true, pwUnsent: false, pwError: "" });
          return;
        }
        if (s.pwSaving) return;

        this.setState({ pwSaving: true, pwUnsent: false, pwError: "" });
        try {
          await profileService.changePassword({ current: s.pwCur, next: s.pwNew });
          this.setState({
            pwTried: false,
            pwSaving: false,
            pwUnsent: true,
            pwCur: "",
            pwNew: "",
            pwNew2: "",
          });
        } catch (error) {
          this.setState({
            pwSaving: false,
            pwUnsent: false,
            pwError: error instanceof Error ? error.message : "비밀번호를 변경하지 못했어요.",
          });
        }
      },
      notifs: N.map((n, i) => ({
        label: n[0],
        hint: n[1],
        on: s.notif[i],
        toggle: (e) => {
          const a = s.notif.slice();
          a[i] = e.target.checked;
          void profileService.updateNotificationPrefs(a);
          this.setState({ notif: a });
        },
      })),
      outOpen: s.outOpen,
      outClosed: !s.outOpen,
      outAgree: s.outAgree,
      outBad: s.outTried && !s.outAgree,
      outSaving: s.outSaving,
      outError: s.outError,
      openOut: () => this.setState({ outOpen: true }),
      closeOut: () =>
        this.setState({
          outOpen: false,
          outAgree: false,
          outTried: false,
          outError: "",
          outSaving: false,
        }),
      onOutAgree: (e) => this.setState({ outAgree: e.target.checked, outError: "" }),
      confirmOut: async () => {
        if (!s.outAgree) {
          this.setState({ outTried: true, outError: "" });
          return;
        }
        if (s.outSaving) return;

        this.setState({ outSaving: true, outError: "" });
        try {
          await profileService.withdraw();
          clearSessionUser();
          window.location.replace(ROUTES.landing);
        } catch (error) {
          this.setState({
            outSaving: false,
            outError: error instanceof Error ? error.message : "탈퇴를 완료하지 못했어요.",
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
          <Header active="profile" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <SideNav active="profile" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--lav ie-in" aria-labelledby="pf-h">
              <span
                className="ie-orb"
                style={{ width: "110px", height: "110px", left: "42%", top: "-40px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "560px" }}>
                <h1 id="pf-h" className="ie-title">
                  내 정보
                </h1>
                <p className="ie-body-lg ie-sub">
                  닉네임과 비밀번호를 바꾸고, 이음쌤 배정을 확인해요.
                </p>
                <div className="ie-banner-actions">
                  <A className="ie-btn ie-btn--text" href={ROUTES.terms}>
                    약관 보기
                  </A>
                  <A
                    className="ie-btn ie-btn--outline"
                    href={ROUTES.landing}
                    onClick={clearSessionUser}
                  >
                    로그아웃
                  </A>
                </div>
              </div>
              <div className="ie-banner-art ie-fade-l">
                <img className="ie-3img" src={img.bannerAreas} alt="" draggable="false" />
              </div>
            </section>
            <div className="ie-twocol">
              <div className="ie-stack">
                <section className="ie-card" aria-labelledby="pf-basic" style={{ gap: "16px" }}>
                  <h2 id="pf-basic" className="ie-h2">
                    기본 정보
                  </h2>
                  <div className="ie-grid-2">
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="pf-id">
                        아이디
                      </label>
                      <input
                        id="pf-id"
                        className="ie-input"
                        type="text"
                        value={v.loginId}
                        disabled
                        aria-describedby="pf-id-h"
                      />
                      <span id="pf-id-h" className="ie-help">
                        아이디는 바꿀 수 없어요.
                      </span>
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="pf-nick">
                        {"닉네임 "}
                        <span className="ie-req">필수</span>
                      </label>
                      <input
                        id="pf-nick"
                        className={v.nickCls}
                        type="text"
                        value={v.nick}
                        onChange={v.onNick}
                        aria-invalid={v.nickBad}
                      />
                      {v.nickBad ? (
                        <span className="ie-error-text">닉네임을 적어 주세요.</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="pf-mail">
                      {"이메일 "}
                      <span className="ie-opt">선택</span>
                    </label>
                    <input
                      id="pf-mail"
                      className="ie-input"
                      type="email"
                      value={v.mail}
                      onChange={v.onMail}
                    />
                  </div>
                  {v.basicUnsent ? (
                    <div className="ie-alert ie-alert--ok" role="status">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#FFD6C1" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#94431F"
                        />
                      </svg>
                      <div>
                        <b>저장했어요.</b>
                      </div>
                    </div>
                  ) : null}
                  <div className="ie-row">
                    <button type="button" className="ie-btn ie-btn--primary" onClick={v.saveBasic}>
                      저장하기
                    </button>
                  </div>
                </section>
                <section className="ie-card" aria-labelledby="pf-pw" style={{ gap: "16px" }}>
                  <h2 id="pf-pw" className="ie-h2">
                    비밀번호 바꾸기
                  </h2>
                  <div className="ie-grid-2">
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="pf-cur">
                        {"현재 비밀번호 "}
                        <span className="ie-req">필수</span>
                      </label>
                      <input
                        id="pf-cur"
                        className={v.curCls}
                        type="password"
                        autoComplete="current-password"
                        value={v.pwCur}
                        onChange={v.onPwCur}
                        aria-invalid={v.curBad}
                      />
                      {v.curBad ? (
                        <span className="ie-error-text">
                          {v.pwCurrentError ? v.pwError : "현재 비밀번호를 적어 주세요."}
                        </span>
                      ) : null}
                    </div>
                    <div />
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="pf-new">
                        {"새 비밀번호 "}
                        <span className="ie-req">필수</span>
                      </label>
                      <input
                        id="pf-new"
                        className={v.newCls}
                        type="password"
                        autoComplete="new-password"
                        value={v.pwNew}
                        onChange={v.onPwNew}
                        aria-invalid={v.newBad}
                        aria-describedby="pf-new-h"
                      />
                      <span id="pf-new-h" className="ie-help">
                        8자 이상이에요.
                      </span>
                      {v.newBad ? (
                        <span className="ie-error-text">
                          새 비밀번호를 8자 이상으로 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="pf-new2">
                        {"새 비밀번호 확인 "}
                        <span className="ie-req">필수</span>
                      </label>
                      <input
                        id="pf-new2"
                        className={v.new2Cls}
                        type="password"
                        autoComplete="new-password"
                        value={v.pwNew2}
                        onChange={v.onPwNew2}
                        aria-invalid={v.new2Bad}
                      />
                      {v.new2Bad ? (
                        <span className="ie-error-text">새 비밀번호와 같게 적어 주세요.</span>
                      ) : null}
                    </div>
                  </div>
                  {v.pwError && !v.pwCurrentError ? (
                    <div className="ie-error-text" role="alert">
                      {v.pwError}
                    </div>
                  ) : null}
                  {v.pwUnsent ? (
                    <div className="ie-alert ie-alert--ok" role="status">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#FFD6C1" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#94431F"
                        />
                      </svg>
                      <div>
                        <b>저장했어요.</b>
                      </div>
                    </div>
                  ) : null}
                  <div className="ie-row">
                    <button
                      type="button"
                      className="ie-btn ie-btn--primary"
                      onClick={v.savePw}
                      disabled={v.pwSaving}
                    >
                      {v.pwSaving ? "변경 중..." : "비밀번호 바꾸기"}
                    </button>
                  </div>
                </section>
              </div>
              <aside aria-label="내 정보 요약">
                <section
                  className="ie-profcard ie-pop"
                  aria-label="내 프로필 요약"
                  style={{ "--d": "1" } as CSSProperties}
                >
                  <span className="ie-avatar-xl" aria-hidden="true">
                    {v.nick.slice(0, 1) || "?"}
                  </span>
                  <b className="ie-h2" style={{ marginTop: "6px" }}>
                    {v.nick}
                  </b>
                  <span className="ie-body ie-sub">{v.loginId}</span>
                </section>
                <section
                  className="ie-card ie-card--mint ie-tcard ie-pop"
                  aria-labelledby="pf-teacher"
                  style={{ gap: "14px", "--d": "2" } as CSSProperties}
                >
                  <div className="ie-row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                    <span className="ie-ava ie-ava--2" aria-hidden="true">
                      푸
                    </span>
                    <div className="ie-stack-s" style={{ gap: "2px" }}>
                      <h2 id="pf-teacher" className="ie-h3">
                        이음쌤 배정
                      </h2>
                      <span className="ie-body ie-strong">
                        {v.teacher?.nickname ?? "아직 담당 이음쌤이 없어요"}
                      </span>
                    </div>
                    <span
                      className={`ie-status ${v.teacher ? "ie-status--done" : "ie-status--new"}`}
                      style={{ marginLeft: "auto" }}
                    >
                      {v.teacher ? "배정됐어요" : "배정 전"}
                    </span>
                  </div>
                  <p className="ie-body">
                    쪽지로 이야기를 시작하면 이음쌤이 직접 읽고 답해요. 이음쌤은 질문지 응답과 비교
                    결과를 볼 수 있고, 내가 남긴 한 줄 메모는 볼 수 없어요.
                  </p>
                  <div className="ie-row">
                    <A className="ie-btn ie-btn--secondary ie-btn--sm" href={ROUTES.messages}>
                      내 쪽지함
                    </A>
                    <A className="ie-btn ie-btn--outline ie-btn--sm" href={ROUTES.talk}>
                      쪽지 쓰기
                    </A>
                  </div>
                  <p className="ie-help">이음쌤 없이도 학습은 끝까지 할 수 있어요.</p>
                </section>
                <section
                  className="ie-card ie-danger-zone"
                  aria-labelledby="pf-out"
                  style={{ gap: "16px" }}
                >
                  <h2 id="pf-out" className="ie-h2">
                    탈퇴
                  </h2>
                  <p className="ie-body">
                    탈퇴하면 기록을 바로 지워요. 지운 기록은 되돌릴 수 없어요. 탈퇴하지 않아도
                    마지막 이용 뒤 1년이 지나면 지워요.
                  </p>
                  {v.outOpen ? (
                    <div
                      className="ie-stack-s"
                      style={{ gap: "12px" }}
                      role="group"
                      aria-label="탈퇴 확인"
                    >
                      <label className="ie-native">
                        <input type="checkbox" checked={v.outAgree} onChange={v.onOutAgree} />
                        {" 기록이 바로 지워지는 것을 알고 있어요"}
                      </label>{" "}
                      {v.outBad ? (
                        <span className="ie-error-text">확인에 체크해 주세요.</span>
                      ) : null}{" "}
                      {v.outError ? (
                        <div className="ie-error-text" role="alert">
                          {v.outError}
                        </div>
                      ) : null}
                      <div className="ie-row">
                        <button
                          type="button"
                          className="ie-btn ie-btn--danger"
                          onClick={v.confirmOut}
                          disabled={v.outSaving}
                        >
                          {v.outSaving ? "탈퇴 중..." : "탈퇴하기"}
                        </button>
                        <button
                          type="button"
                          className="ie-btn ie-btn--outline"
                          onClick={v.closeOut}
                        >
                          그만둘게요
                        </button>
                      </div>
                    </div>
                  ) : null}{" "}
                  {v.outClosed ? (
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline"
                        aria-expanded={v.outOpen}
                        onClick={v.openOut}
                      >
                        탈퇴 알아보기
                      </button>
                    </div>
                  ) : null}
                </section>
              </aside>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
