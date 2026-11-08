/**
 * S02 로그인
 * (원본 디자인: Login.dc.html)
 */
import { Component, Fragment } from "react";
import { authService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";

export default class Login extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = this.initState();
  }
  componentDidMount() {
    try {
      const root = document.querySelector(".ie-root") as any;
      if (root && typeof IntersectionObserver !== "undefined") {
        this._io = new IntersectionObserver((es) => {
          const on = es[es.length - 1].isIntersecting;
          if (!on) {
            this._away = true;
          } else if (this._away) {
            this._away = false;
            this.setState(this.initState());
          }
        });
        this._io.observe(root);
      }
    } catch (err) {}
    try {
      this._st = (ev) => {
        if (ev.key === "ieum-reset-login") {
          this.setState(this.initState());
        }
      };
      window.addEventListener("storage", this._st);
    } catch (err) {}
  }
  componentWillUnmount() {
    try {
      if (this._io) this._io.disconnect();
      window.removeEventListener("storage", this._st);
    } catch (err) {}
  }
  initState() {
    return { uid: "", pw: "", showPw: false, tried: false, msg: false, sns: false };
  }
  renderVals() {
    const s = this.state;
    const idBad = s.tried && s.uid.trim() === "";
    const pwBad = s.tried && s.pw === "";
    const cls = (b) => (b ? "ie-input is-error" : "ie-input");
    const SNS = ["네이버", "구글", "카카오"];
    return {
      uid: s.uid,
      pw: s.pw,
      showPw: s.showPw,
      pwType: s.showPw ? "text" : "password",
      idBad,
      pwBad,
      idCls: cls(idBad),
      pwCls: cls(pwBad),
      msg: s.msg,
      snsMsg: s.sns,
      onUid: (e) => this.setState({ uid: e.target.value, msg: false }),
      onPw: (e) => this.setState({ pw: e.target.value, msg: false }),
      togglePw: () => this.setState({ showPw: !s.showPw }),
      resetAll: () => this.setState(this.initState()),
      toSignup: () => {
        try {
          window.localStorage.setItem("ieum-reset-signup", String(Date.now()));
        } catch (err) {}
        this.setState(this.initState());
      },
      submit: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const g = (id, cur) => {
          try {
            const el = document.getElementById(id) as any;
            return el && typeof el.value === "string" ? el.value : cur;
          } catch (err) {
            return cur;
          }
        };
        const uid = g("lg-id", s.uid);
        const pw = g("lg-pw", s.pw);
        if (uid.trim() === "" || pw === "") {
          this.setState({ uid, pw, tried: true, msg: false });
          return;
        }
        // 백엔드 연결 지점: 로그인 요청
        void authService.login({ uid, pw });
        this.setState({ uid, pw, tried: false, msg: true, sns: false });
      },
      sns: SNS.map((n) => ({
        label: n + "로 로그인",
        pick: () => this.setState({ sns: true, msg: false }),
      })),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="none" role="guest-plain" />
        </div>
        <div className="ie-body-row">
          <main className="ie-main ie-authmain" style={{ margin: "0 auto", width: "100%" }}>
            <div className="ie-su ie-in" style={{ "--d": "1" } as CSSProperties}>
              <div className="ie-su-head">
                <h1 className="ie-title">로그인</h1>
                <p className="ie-body-lg ie-sub">
                  아이디와 비밀번호를 적어 주세요. 학습자도 이음쌤도 같은 곳에서 로그인해요.
                </p>
              </div>
              <section className="ie-card ie-lgcard" aria-labelledby="lg-h" style={{ gap: "20px" }}>
                <h2 id="lg-h" className="ie-h2">
                  일반 계정 로그인
                </h2>
                <form className="ie-stack-s" style={{ gap: "16px" }} onSubmit={v.submit} noValidate>
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="lg-id">
                      {"아이디 "}
                      <span className="ie-req">필수</span>
                    </label>{" "}
                    <input
                      id="lg-id"
                      className={v.idCls}
                      type="text"
                      autoComplete="username"
                      value={v.uid}
                      onChange={v.onUid}
                      aria-invalid={v.idBad}
                    />{" "}
                    {v.idBad ? <span className="ie-error-text">아이디를 적어 주세요.</span> : null}
                  </div>
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="lg-pw">
                      {"비밀번호 "}
                      <span className="ie-req">필수</span>
                    </label>{" "}
                    <input
                      id="lg-pw"
                      className={v.pwCls}
                      type={v.pwType}
                      autoComplete="current-password"
                      value={v.pw}
                      onChange={v.onPw}
                      aria-invalid={v.pwBad}
                    />{" "}
                    {v.pwBad ? (
                      <span className="ie-error-text">비밀번호를 적어 주세요.</span>
                    ) : null}
                    <div>
                      <button
                        type="button"
                        className="ie-chip"
                        aria-pressed={v.showPw}
                        onClick={v.togglePw}
                      >
                        <span className="ie-box" />
                        비밀번호 보기
                      </button>
                    </div>
                  </div>
                  <div className="ie-row">
                    <button
                      type="submit"
                      className="ie-btn ie-btn--primary ie-btn--lg"
                      onClick={v.submit}
                    >
                      로그인
                    </button>
                  </div>
                  {v.msg ? (
                    <div className="ie-alert ie-alert--info" role="status">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#BFDDFF" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#2B5C96"
                        />
                      </svg>
                      <div>
                        {"화면을 둘러보는 시안이에요. 실제로는 학습자는 "}
                        <A href={ROUTES.home} onClick={v.resetAll}>
                          홈
                        </A>
                        {"으로, 이음쌤은 "}
                        <A href={ROUTES.teacher} onClick={v.resetAll}>
                          이음쌤 홈
                        </A>
                        으로 이동해요. 만 14세 미만 계정이 보호자 확인 전이면 “보호자 확인이 끝나면
                        시작할 수 있어요.”라고 안내해요. 비밀번호를 잊으면 운영 담당자에게 알려
                        주세요.
                      </div>
                    </div>
                  ) : null}
                </form>
                <div className="ie-row" style={{ gap: "12px", flexWrap: "wrap" }}>
                  <span className="ie-body ie-strong">아직 계정이 없나요?</span>
                  <A className="ie-btn ie-btn--outline" href={ROUTES.signup} onClick={v.toSignup}>
                    회원 가입
                  </A>
                  <A className="ie-btn ie-btn--text" href={ROUTES.landing} onClick={v.resetAll}>
                    처음 화면으로
                  </A>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
