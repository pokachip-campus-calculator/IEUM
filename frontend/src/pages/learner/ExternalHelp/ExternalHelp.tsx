/**
 * S13 도움 받을 수 있는 곳
 * (원본 디자인: ExternalHelp.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";

export default class ExternalHelp extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { region: "", tried: false, unsent: false };
  }
  renderVals() {
    const s = this.state;
    const R = [
      "서울",
      "부산",
      "대구",
      "인천",
      "광주",
      "대전",
      "울산",
      "세종",
      "경기",
      "강원",
      "충북",
      "충남",
      "전북",
      "전남",
      "경북",
      "경남",
      "제주",
    ];
    const bad = s.tried && s.region === "";
    return {
      regions: R.map((v) => ({ v })),
      region: s.region,
      rBad: bad,
      rCls: bad ? "ie-select is-error" : "ie-select",
      unsent: s.unsent,
      onRegion: (e) => this.setState({ region: e.target.value, unsent: false }),
      find: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (s.region === "") {
          this.setState({ tried: true, unsent: false });
          return;
        }
        this.setState({ tried: false, unsent: true });
      },
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="help" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <SideNav active="help" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--peach ie-in" aria-labelledby="ex-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "40%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "560px" }}>
                <h1 id="ex-h" className="ie-title">
                  도움 받을 수 있는 곳
                </h1>
                <p className="ie-body-lg ie-sub">
                  이음은 전문 상담을 대신하지 않아요. 더 깊은 이야기는 아래 어디에서든 나눌 수
                  있어요.
                </p>
              </div>
              <div className="ie-banner-art ie-fade-l">
                <img className="ie-3img" src={img.bannerHelp} alt="" draggable="false" />
              </div>
            </section>
            <div className="ie-stack" style={{ gap: "26px" }}>
              <section
                className="ie-stack-s ie-in"
                style={{ "--d": "1", gap: "14px" } as CSSProperties}
                aria-labelledby="ex-call"
              >
                <h2 id="ex-call" className="ie-h2">
                  지금 바로 전화할 수 있어요
                </h2>
                <div className="ie-emerg ie-callgrid">
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
                <p className="ie-body">
                  쪽지나 답변을 기다리지 말고 번호로 먼저 연락해요. 곁에 있는 어른에게
                  “도와주세요”라고 말해도 돼요.
                </p>
              </section>
              <section className="ie-stack-s" aria-labelledby="ex-other" style={{ gap: "14px" }}>
                <h2 id="ex-other" className="ie-h2">
                  이런 곳에서도 이야기할 수 있어요
                </h2>
                <div className="ie-people3">
                  <div
                    className="ie-pcard3 ie-pcard3--sky ie-pop"
                    style={{ "--d": "1" } as CSSProperties}
                  >
                    <span className="ie-tile" aria-hidden="true">
                      <svg width="32" height="32" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M24 100 L128 44 L232 100Z" fill="#9CC8F5" />
                        <rect x="48" y="100" width="160" height="104" rx="10" fill="#D6E8FA" />
                        <rect x="108" y="142" width="40" height="62" rx="8" fill="#5C86C6" />
                        <rect x="64" y="124" width="28" height="28" rx="7" fill="#FFFFFF" />
                        <rect x="164" y="124" width="28" height="28" rx="7" fill="#FFFFFF" />
                        <circle cx="128" cy="86" r="10" fill="#FFFFFF" />
                      </svg>
                    </span>
                    <b className="ie-h3">학교 안</b>
                    <span className="ie-body ie-sub">담임·상담·보건 선생님, 학교 상담실</span>
                  </div>
                  <div
                    className="ie-pcard3 ie-pcard3--peach ie-pop"
                    style={{ "--d": "2" } as CSSProperties}
                  >
                    <span className="ie-tile" aria-hidden="true">
                      <svg width="32" height="32" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M24 122 L128 38 L232 122Z" fill="#F8B79C" />
                        <rect x="52" y="116" width="152" height="96" rx="12" fill="#FFE3D3" />
                        <rect x="108" y="150" width="40" height="62" rx="9" fill="#E0825C" />
                        <circle cx="128" cy="98" r="14" fill="#FFFFFF" />
                      </svg>
                    </span>
                    <b className="ie-h3">집과 가까운 어른</b>
                    <span className="ie-body ie-sub">가족이나 친척 중 믿을 수 있는 어른</span>
                  </div>
                  <div
                    className="ie-pcard3 ie-pcard3--lav ie-pop"
                    style={{ "--d": "3" } as CSSProperties}
                  >
                    <span className="ie-tile" aria-hidden="true">
                      <svg width="32" height="32" viewBox="0 0 256 256" aria-hidden="true">
                        <rect x="28" y="44" width="200" height="140" rx="44" fill="#CDBFF7" />
                        <path d="M84 184 L70 226 L128 184Z" fill="#CDBFF7" />
                        <path
                          d="M128 150 C100 132 82 116 82 96 A24 24 0 0 1 128 88 A24 24 0 0 1 174 96 C174 116 156 132 128 150Z"
                          fill="#FFFFFF"
                        />
                      </svg>
                    </span>
                    <b className="ie-h3">이음쌤</b>
                    <span className="ie-body ie-sub">
                      쪽지로 이야기해요. 답변까지 시간이 걸릴 수 있어요.
                    </span>
                    <A
                      className="ie-btn ie-btn--secondary ie-btn--sm"
                      style={{ alignSelf: "flex-start" }}
                      href={ROUTES.talk}
                    >
                      쪽지 쓰기
                    </A>
                  </div>
                </div>
              </section>
              <div className="ie-row">
                <A className="ie-btn ie-btn--text" href={ROUTES.home}>
                  홈으로 돌아가기
                </A>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
