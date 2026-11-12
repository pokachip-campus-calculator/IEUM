
/**
 * S02 로그인
 * (원본 디자인: Login.dc.html)
 */
import { Component } from "react";
import { ApiError, authService, setSessionUser } from "@/api";
import type { LoginResponse, SessionUser } from "@/api";
import { useNavigate } from "react-router-dom";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";

class Login extends Component<any, any> {
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
    return {
      uid: "",
      pw: "",
      showPw: false,
      tried: false,
      msg: false,
      sns: false,
      error: "",
      loading: false,
    };
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
      error: s.error,
      loading: s.loading,

      onUid: (e) =>
        this.setState({
          uid: e.target.value,
          msg: false,
          error: "",
        }),

      onPw: (e) =>
        this.setState({
          pw: e.target.value,
          msg: false,
          error: "",
        }),

      togglePw: () => this.setState({ showPw: !s.showPw }),

      resetAll: () => this.setState(this.initState()),

      toSignup: () => {
        try {
          window.localStorage.setItem(
            "ieum-reset-signup",
            String(Date.now())
          );
        } catch (err) {}
        this.setState(this.initState());
      },

      submit: async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (this.state.loading) return;

        const uid = this.state.uid;
        const pw = this.state.pw;

        if (uid.trim() === "" || pw === "") {
          this.setState({
            tried: true,
            msg: false,
            error: "",
          });
          return;
        }

        this.setState({
          loading: true,
          error: "",
          msg: false,
          tried: false,
        });

        try {
          // 백엔드 로그인 요청
          const response: LoginResponse = await authService.login({
            loginId: uid.trim(),
            password: pw,
          });

          // 백엔드 사용자 정보를 프론트엔드 형식으로 변환
          const user: SessionUser = {
            id: response.user.id,
            nick: response.user.nickname,
            role:
              response.user.role === "STUDENT"
                ? "learner"
                : "teacher",
          };

          // 로그인 사용자 정보와 JWT 토큰 저장
          setSessionUser(user, response.token, response.expiresAt);
          this.setState({ loading: false });

          // 사용자 역할에 따라 홈 화면 이동
          if (user.role === "learner") {
            this.props.navigate(ROUTES.home);
          } else {
            this.props.navigate(ROUTES.teacher);
          }
        } catch (err) {
          console.error("로그인 오류:", err);

          this.setState({
            error: err instanceof ApiError && err.code === "TOO_MANY_ATTEMPTS"
              ? "로그인 시도가 너무 많아요. 5분 뒤에 다시 시도해 주세요."
              : err instanceof ApiError
              ? err.message
              : "로그인 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
            loading: false,
            msg: false,
          });
        }
      },

      sns: SNS.map((n) => ({
        label: n + "로 로그인",
        pick: () =>
          this.setState({
            sns: true,
            msg: false,
          }),
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
          <main
            className="ie-main ie-authmain"
            style={{ margin: "0 auto", width: "100%" }}
          >
            <div
              className="ie-su ie-in"
              style={{ "--d": "1" } as CSSProperties}
            >
              <div className="ie-su-head">
                <h1 className="ie-title">로그인</h1>
                <p className="ie-body-lg ie-sub">
                  아이디와 비밀번호를 적어 주세요. 학습자도 이음쌤도 같은 곳에서 로그인해요.
                </p>
              </div>

              <section
                className="ie-card ie-lgcard"
                aria-labelledby="lg-h"
                style={{ gap: "20px" }}
              >
                <h2 id="lg-h" className="ie-h2">
                  일반 계정 로그인
                </h2>

                <form
                  className="ie-stack-s"
                  style={{ gap: "16px" }}
                  onSubmit={v.submit}
                  noValidate
                >
                  <div className="ie-field">
                    <label className="ie-label" htmlFor="lg-id">
                      {"아이디 "}
                      <span className="ie-req">필수</span>
                    </label>

                    <input
                      id="lg-id"
                      className={v.idCls}
                      type="text"
                      autoComplete="username"
                      value={v.uid}
                      onChange={v.onUid}
                      aria-invalid={v.idBad}
                    />

                    {v.idBad ? (
                      <span className="ie-error-text">
                        아이디를 적어 주세요.
                      </span>
                    ) : null}
                  </div>

                  <div className="ie-field">
                    <label className="ie-label" htmlFor="lg-pw">
                      {"비밀번호 "}
                      <span className="ie-req">필수</span>
                    </label>

                    <input
                      id="lg-pw"
                      className={v.pwCls}
                      type={v.pwType}
                      autoComplete="current-password"
                      value={v.pw}
                      onChange={v.onPw}
                      aria-invalid={v.pwBad}
                    />

                    {v.pwBad ? (
                      <span className="ie-error-text">
                        비밀번호를 적어 주세요.
                      </span>
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
                      disabled={v.loading}
                    >
                      {v.loading ? "로그인 중..." : "로그인"}
                    </button>
                  </div>

                  {v.error ? (
                    <div
                      className="ie-alert ie-alert--info"
                      role="alert"
                    >
                      {v.error}
                    </div>
                  ) : null}
                </form>

                <div
                  className="ie-row"
                  style={{ gap: "12px", flexWrap: "wrap" }}
                >
                  <span className="ie-body ie-strong">
                    아직 계정이 없나요?
                  </span>

                  <A
                    className="ie-btn ie-btn--outline"
                    href={ROUTES.signup}
                    onClick={v.toSignup}
                  >
                    회원 가입
                  </A>

                  <A
                    className="ie-btn ie-btn--text"
                    href={ROUTES.landing}
                    onClick={v.resetAll}
                  >
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

// React Router 페이지 이동 기능 연결
export default function LoginPage() {
  const navigate = useNavigate();
  return <Login navigate={navigate} />;
}
