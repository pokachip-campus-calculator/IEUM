/**
 * S11 이음상담소 (쪽지 쓰기)
 * (원본 디자인: Talk.dc.html)
 */
import { Component, Fragment } from "react";
import { messageService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";

export default class Talk extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { topic: "", body: "", tried: false, sent: false, popup: false, apiError: "" };
  }
  renderVals() {
    const s = this.state;
    const topicInvalid = s.tried && s.topic === "";
    const bodyInvalid = s.tried && s.body.trim() === "";
    return {
      statusLabel: s.sent ? "보냈어요" : "작성 중",
      statusCls: s.sent ? "ie-status ie-status--done" : "ie-status ie-status--doing",
      editing: !s.sent,
      isSent: s.sent,
      isPopup: s.popup,
      apiError: s.apiError,
      closePop: () => this.setState({ popup: false }),
      topic: s.topic,
      body: s.body,
      count: s.body.length,
      topicInvalid,
      bodyInvalid,
      topicCls: topicInvalid ? "ie-select is-error" : "ie-select",
      bodyCls: bodyInvalid ? "ie-textarea is-error" : "ie-textarea",
      onTopic: (e) => this.setState({ topic: e.target.value }),
      onBody: (e) => this.setState({ body: e.target.value }),
      submit: async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const cur = this.state;
        if (cur.topic === "" || cur.body.trim() === "") {
          this.setState({ tried: true });
          return;
        }
        this.setState({ apiError: "" });
        try {
          await messageService.sendNote({
            topic: cur.topic,
            body: cur.body,
            // 시나리오 연습에서 넘어왔으면 그 연습과 이어서 보내요(이음쌤 화면의 "연결된 시나리오")
            practiceId: this.props.practiceId,
          });
          this.setState({ tried: false, sent: true, popup: true });
        } catch (error) {
          this.setState({
            apiError: error instanceof Error ? error.message : "쪽지를 보내지 못했어요.",
          });
        }
      },
      clear: () => this.setState({ topic: "", body: "", tried: false }),
      again: () => this.setState({ topic: "", body: "", tried: false, sent: false, popup: false }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="talk" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <SideNav active="talk" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--peach ie-in" aria-labelledby="tk-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "40%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ maxWidth: "560px" }}>
                <h1 id="tk-h" className="ie-title">
                  이음상담소
                </h1>
                <p className="ie-body-lg ie-sub">
                  이음쌤에게 쪽지를 보낼 수 있어요. 짧게 적어도 괜찮아요.
                </p>
                {this.props.practiceId ? (
                  <p className="ie-body ie-sub" style={{ marginTop: "6px" }}>
                    {this.props.practiceTitle
                      ? `‘${this.props.practiceTitle}’ 연습과 이어서 보내요.`
                      : "방금 한 연습과 이어서 보내요."}
                  </p>
                ) : null}
                <div className="ie-banner-actions">
                  <span className={v.statusCls}>{v.statusLabel}</span>
                  <A className="ie-btn ie-btn--outline" href={ROUTES.messages}>
                    내 쪽지함
                  </A>
                </div>
              </div>
              <div className="ie-banner-art ie-fade-l">
                <img className="ie-3img" src={img.bannerTalk} alt="" draggable="false" />
              </div>
            </section>
            <div className="ie-twocol">
              <div className="ie-stack">
                {v.editing ? (
                  <form className="ie-card" aria-labelledby="form-t" onSubmit={v.submit} noValidate>
                    <div className="ie-row-between">
                      <div className="ie-formhead">
                        <span className="ie-formico">
                          <svg width="28" height="28" viewBox="0 0 256 256" aria-hidden="true">
                            <rect x="28" y="52" width="200" height="152" rx="28" fill="#CDBFF7" />
                            <path
                              d="M40 84 L128 146 L216 84"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="14"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="206" cy="62" r="22" fill="#F4A68C" />
                          </svg>
                        </span>
                        <h2 id="form-t" className="ie-h2">
                          쪽지 쓰기
                        </h2>
                      </div>
                      <span className="ie-meta">
                        <span className="ie-req">필수</span>
                        {" 표시는 꼭 필요한 항목이에요"}
                      </span>
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="topic">
                        {"주제 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <select
                        id="topic"
                        className={v.topicCls}
                        value={v.topic}
                        onChange={v.onTopic}
                        aria-invalid={v.topicInvalid}
                        aria-describedby="topic-e"
                      >
                        <option value="">주제를 골라 주세요</option>
                        <option value="친구 관계">친구 관계</option>
                        <option value="온라인에서 생긴 일">온라인에서 생긴 일</option>
                        <option value="학교생활">학교생활</option>
                        <option value="집과 일상">집과 일상</option>
                        <option value="그 밖의 이야기">그 밖의 이야기</option>
                      </select>{" "}
                      {v.topicInvalid ? (
                        <span id="topic-e" className="ie-error-text" role="alert">
                          주제를 입력해주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="body">
                        {"하고 싶은 이야기 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <textarea
                        id="body"
                        className={v.bodyCls}
                        maxLength={500}
                        value={v.body}
                        onChange={v.onBody}
                        aria-invalid={v.bodyInvalid}
                        aria-describedby="body-h body-e"
                        placeholder="예: 요즘 단톡방 때문에 마음이 불편해요."
                      />
                      <div className="ie-row-between">
                        <span id="body-h" className="ie-help">
                          이름·학교·연락처는 적지 않아도 돼요.
                        </span>
                        <span className="ie-help">
                          {v.count}
                          {" / 500"}
                        </span>
                      </div>
                      {v.bodyInvalid ? (
                        <span id="body-e" className="ie-error-text" role="alert">
                          내용을 입력해주세요.
                        </span>
                      ) : null}
                      {v.apiError ? (
                        <span className="ie-error-text" role="alert">
                          {v.apiError}
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--primary ie-btn--lg"
                        onClick={v.submit}
                      >
                        쪽지 보내기
                      </button>{" "}
                      <button type="button" className="ie-btn ie-btn--text" onClick={v.clear}>
                        처음부터 다시 쓰기
                      </button>
                    </div>
                  </form>
                ) : null}{" "}
                {v.isSent ? (
                  <section
                    className="ie-card ie-card--hero ie-card--mint ie-pop"
                    role="status"
                    aria-labelledby="sent-t"
                    style={{ gap: "16px", alignItems: "flex-start" }}
                  >
                    <div className="ie-donehero" aria-hidden="true">
                      <svg
                        viewBox="0 0 520 200"
                        preserveAspectRatio="xMaxYMid meet"
                        aria-hidden="true"
                      >
                        <defs>
                          <radialGradient id="bd-r" cx=".5" cy=".5" r=".5">
                            <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
                            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <circle
                          className="ie-a-ring"
                          style={{ animationDelay: "-0s" }}
                          cx="300"
                          cy="100"
                          r="44"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="3"
                        />
                        <circle
                          className="ie-a-ring"
                          style={{ animationDelay: "-1.2s" }}
                          cx="300"
                          cy="100"
                          r="44"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="3"
                        />
                        <circle
                          className="ie-a-ring"
                          style={{ animationDelay: "-2.4s" }}
                          cx="300"
                          cy="100"
                          r="44"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="3"
                        />
                        <circle cx="300" cy="100" r="84" fill="url(#bd-r)" />
                        <g className="ie-a-bob" style={{ animationDelay: "-0.2s" }}>
                          <svg
                            viewBox="0 0 40 40"
                            x="266"
                            y="64"
                            width="68"
                            height="68"
                            overflow="visible"
                          >
                            <defs>
                              <radialGradient id="gm-opal" cx=".38" cy=".3" r=".85">
                                <stop offset="0" stopColor="#FFFFFF" />
                                <stop offset=".6" stopColor="#FCEFF4" />
                                <stop offset="1" stopColor="#E7DBF6" />
                              </radialGradient>
                              <clipPath id="gm-opal-c">
                                <ellipse cx="20" cy="19.6" rx="13.4" ry="16.4" />
                              </clipPath>
                              <radialGradient id="gm-opal-s" cx=".5" cy=".5" r=".6">
                                <stop offset=".7" stopColor="#FFFFFF" stopOpacity="0" />
                                <stop offset="1" stopColor="#9A7BC8" stopOpacity=".22" />
                              </radialGradient>
                              <radialGradient id="gm-opal-9FE0E8">
                                <stop offset="0" stopColor="#9FE0E8" stopOpacity=".95" />
                                <stop offset="1" stopColor="#9FE0E8" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="gm-opal-FFC9AE">
                                <stop offset="0" stopColor="#FFC9AE" stopOpacity=".95" />
                                <stop offset="1" stopColor="#FFC9AE" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="gm-opal-C9B8FF">
                                <stop offset="0" stopColor="#C9B8FF" stopOpacity=".95" />
                                <stop offset="1" stopColor="#C9B8FF" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="gm-opal-F9C3DA">
                                <stop offset="0" stopColor="#F9C3DA" stopOpacity=".95" />
                                <stop offset="1" stopColor="#F9C3DA" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="gm-opal-FFF1B8">
                                <stop offset="0" stopColor="#FFF1B8" stopOpacity=".95" />
                                <stop offset="1" stopColor="#FFF1B8" stopOpacity="0" />
                              </radialGradient>
                              <clipPath id="gm-opal-fx">
                                <ellipse cx="20" cy="19.6" rx="13.4" ry="16.4" />
                              </clipPath>
                              <linearGradient id="gm-opal-fx-g" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stopColor="#FFFFFF" stopOpacity=".42" />
                                <stop offset=".34" stopColor="#FFFFFF" stopOpacity=".08" />
                                <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
                              </linearGradient>
                              <radialGradient id="gm-opal-fx-v" cx=".38" cy=".3" r=".85">
                                <stop offset=".5" stopColor="#C9B8FF" stopOpacity="0" />
                                <stop offset="1" stopColor="#C9B8FF" stopOpacity=".42" />
                              </radialGradient>
                              <radialGradient id="gm-opal-fx-b" cx=".58" cy=".92" r=".55">
                                <stop offset="0" stopColor="#FFFFFF" stopOpacity=".75" />
                                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="gm-opal-fx-s" cx=".5" cy=".5" r=".5">
                                <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
                                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                              </radialGradient>
                              <filter
                                id="gm-opal-fx-sh"
                                x="-30%"
                                y="-30%"
                                width="160%"
                                height="180%"
                              >
                                <feGaussianBlur stdDeviation="1.1" />
                              </filter>
                              <filter
                                id="gm-opal-fx-lit"
                                x="-8%"
                                y="-8%"
                                width="116%"
                                height="120%"
                                colorInterpolationFilters="sRGB"
                              >
                                <feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="bb" />
                                <feSpecularLighting
                                  in="bb"
                                  surfaceScale="2.4"
                                  specularConstant=".5"
                                  specularExponent="20"
                                  lightingColor="#FFFFFF"
                                  result="sp"
                                >
                                  <feDistantLight azimuth="225" elevation="52" />
                                </feSpecularLighting>
                                <feComposite in="sp" in2="SourceAlpha" operator="in" result="spi" />
                                <feComposite
                                  in="SourceGraphic"
                                  in2="spi"
                                  operator="arithmetic"
                                  k1="0"
                                  k2="1"
                                  k3=".35"
                                  k4="0"
                                />
                              </filter>
                            </defs>
                            <ellipse
                              cx="20"
                              cy="37.4"
                              rx="10.5"
                              ry="1.9"
                              fill="#3E4A8A"
                              opacity=".28"
                              filter="url(#gm-opal-fx-sh)"
                            />
                            <g filter="url(#gm-opal-fx-lit)">
                              <ellipse
                                cx="20"
                                cy="19.6"
                                rx="13.4"
                                ry="16.4"
                                fill="url(#gm-opal)"
                                stroke="#5C3C28"
                                strokeOpacity=".16"
                                strokeWidth=".5"
                                strokeLinejoin="round"
                              />
                              <g clipPath="url(#gm-opal-c)">
                                <circle
                                  cx="26"
                                  cy="27"
                                  r="9"
                                  fill="url(#gm-opal-9FE0E8)"
                                  opacity="1"
                                />
                                <circle
                                  cx="13.5"
                                  cy="26"
                                  r="8"
                                  fill="url(#gm-opal-FFC9AE)"
                                  opacity="1"
                                />
                                <circle
                                  cx="25"
                                  cy="13"
                                  r="8"
                                  fill="url(#gm-opal-C9B8FF)"
                                  opacity="1"
                                />
                                <circle
                                  cx="15"
                                  cy="13"
                                  r="7"
                                  fill="url(#gm-opal-F9C3DA)"
                                  opacity="1"
                                />
                                <circle
                                  cx="20"
                                  cy="21"
                                  r="6"
                                  fill="url(#gm-opal-FFF1B8)"
                                  opacity="1"
                                />
                              </g>
                              <ellipse
                                cx="20"
                                cy="19.6"
                                rx="13.4"
                                ry="16.4"
                                fill="url(#gm-opal-s)"
                              />
                              <path
                                d="M12.4 10.6Q14.2 6.8 19 5.8"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity=".95"
                              />
                              <ellipse
                                cx="14.4"
                                cy="11.4"
                                rx="2.6"
                                ry="1.5"
                                fill="#FFFFFF"
                                opacity=".85"
                                transform="rotate(-38 14.4 11.4)"
                              />
                              <path
                                d="M27.4 29.4Q24.4 33.6 19.6 34.4"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="1"
                                strokeLinecap="round"
                                opacity=".55"
                              />
                              <g clipPath="url(#gm-opal-fx)">
                                <rect
                                  x="0"
                                  y="0"
                                  width="40"
                                  height="40"
                                  fill="url(#gm-opal-fx-v)"
                                />
                                <ellipse cx="24" cy="33" rx="12" ry="6" fill="url(#gm-opal-fx-b)" />
                                <rect
                                  x="0"
                                  y="0"
                                  width="40"
                                  height="40"
                                  fill="url(#gm-opal-fx-g)"
                                />
                                <g strokeLinejoin="round">
                                  <ellipse
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeOpacity=".42"
                                    strokeWidth=".9"
                                    cx="20"
                                    cy="19.6"
                                    rx="13.4"
                                    ry="16.4"
                                  />
                                </g>
                                <circle
                                  cx="13.5"
                                  cy="12"
                                  r="3.2"
                                  fill="url(#gm-opal-fx-s)"
                                  opacity=".55"
                                />
                              </g>
                            </g>
                          </svg>
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-0.0s" }}>
                          <rect
                            x="120"
                            y="40"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#F4A68C"
                            transform="rotate(20 120 40)"
                          />
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-0.6s" }}>
                          <rect
                            x="190"
                            y="150"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#9F8FE8"
                            transform="rotate(-30 190 150)"
                          />
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-1.2s" }}>
                          <rect
                            x="420"
                            y="40"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#7CCBAE"
                            transform="rotate(40 420 40)"
                          />
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-1.7999999999999998s" }}>
                          <rect
                            x="470"
                            y="130"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#F6C86A"
                            transform="rotate(-20 470 130)"
                          />
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-2.4s" }}>
                          <rect
                            x="380"
                            y="170"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#F4A6A6"
                            transform="rotate(10 380 170)"
                          />
                        </g>
                        <g className="ie-a-bob" style={{ animationDelay: "-3.0s" }}>
                          <rect
                            x="150"
                            y="100"
                            width="14"
                            height="7"
                            rx="3.5"
                            fill="#7BC8FF"
                            transform="rotate(60 150 100)"
                          />
                        </g>
                        <path
                          d="M90 111Q91.08 118.92 99 120Q91.08 121.08 90 129Q88.92 121.08 81 120Q88.92 118.92 90 111z"
                          fill="#FFFFFF"
                          opacity="0.9"
                          className="ie-a-spark"
                          style={{ animationDelay: "0.0s" }}
                        />
                        <path
                          d="M500 62Q500.96 69.04 508 70Q500.96 70.96 500 78Q499.04 70.96 492 70Q499.04 69.04 500 62z"
                          fill="#FFFFFF"
                          opacity="0.9"
                          className="ie-a-spark"
                          style={{ animationDelay: "2.0s" }}
                        />
                        <path
                          d="M240 169Q240.84 175.16 247 176Q240.84 176.84 240 183Q239.16 176.84 233 176Q239.16 175.16 240 169z"
                          fill="#FFFFFF"
                          opacity="0.9"
                          className="ie-a-spark"
                          style={{ animationDelay: "1.8s" }}
                        />
                        <path
                          d="M360 21Q360.84 27.16 367 28Q360.84 28.84 360 35Q359.16 28.84 353 28Q359.16 27.16 360 21z"
                          fill="#FFFFFF"
                          opacity="0.9"
                          className="ie-a-spark"
                          style={{ animationDelay: "2.4s" }}
                        />
                        <path
                          className="ie-a-beat"
                          style={{ animationDelay: "-0.0s" }}
                          d="M440 105.4 C430.1 99.1 434.6 91.0 440 96.85 C445.4 91.0 449.9 99.1 440 105.4 Z"
                          fill="#F4A6A6"
                          opacity="0.9"
                        />
                      </svg>
                    </div>
                    <h2 id="sent-t" className="ie-h2">
                      쪽지를 보냈어요
                    </h2>
                    <p className="ie-body-lg">
                      이음쌤이 읽고 답해요. 답이 오면 알림으로 알려 줘요. 내 쪽지함에서 볼 수
                      있어요. 바로 답이 오지 않을 수 있어요.
                    </p>
                    <div className="ie-row">
                      <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.messages}>
                        내 쪽지함 보기
                      </A>
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline ie-btn--lg"
                        onClick={v.again}
                      >
                        쪽지 더 쓰기
                      </button>
                      <A className="ie-btn ie-btn--text" href={ROUTES.home}>
                        홈으로
                      </A>
                    </div>
                  </section>
                ) : null}
              </div>
              <aside aria-label="안내">
                <section
                  className="ie-card ie-card--peach ie-pop"
                  aria-labelledby="tk-e"
                  style={{ gap: "12px", "--d": "1" } as CSSProperties}
                >
                  <div className="ie-row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                    <span className="ie-helpheart">
                      <svg width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
                        <path
                          d="M128,216S24,160,24,92A52,52,0,0,1,76,40c21.65,0,40.34,11.22,52,30.8C139.66,51.22,158.35,40,180,40a52,52,0,0,1,52,52C232,160,128,216,128,216Z"
                          fill="#F8C4DA"
                        />
                        <path
                          d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"
                          fill="#963B6A"
                        />
                      </svg>
                    </span>
                    <h2 id="tk-e" className="ie-h3">
                      급한 위험이라면 먼저 전화해요
                    </h2>
                  </div>
                  <p className="ie-body">
                    쪽지는 답변까지 시간이 걸려요. 지금 위험하면 번호로 바로 연락해요.
                  </p>
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
                </section>
                <section
                  className="ie-card ie-card--lav ie-pop"
                  aria-labelledby="tk-n"
                  style={{ gap: "14px", "--d": "2" } as CSSProperties}
                >
                  <h2 id="tk-n" className="ie-h3">
                    보내기 전에 알아 두세요
                  </h2>
                  <ol className="ie-tips">
                    <li>
                      <span className="ie-tips-n" aria-hidden="true">
                        1
                      </span>
                      <span className="ie-body">
                        쪽지를 보내면 이음쌤이 배정되고, 이음쌤이 직접 읽고 답해요. 이음쌤 없이도
                        학습은 끝까지 할 수 있어요.
                      </span>
                    </li>
                    <li>
                      <span className="ie-tips-n" aria-hidden="true">
                        2
                      </span>
                      <span className="ie-body">
                        담당자가 확인한 뒤 답변해요. 바로 오지 않을 수 있어요. 답이 오면 알림으로
                        알려 줘요. 운영 시간: 평일·주말 09:00–18:00(공휴일 제외)
                      </span>
                    </li>
                    <li>
                      <span className="ie-tips-n" aria-hidden="true">
                        3
                      </span>
                      <span className="ie-body">비밀을 무조건 지킨다고 약속하지는 않아요.</span>
                    </li>
                  </ol>
                </section>
              </aside>
            </div>
          </main>
        </div>
        {v.isPopup ? (
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
              className="ie-card ie-card--hero ie-card--mint ie-pop"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="pop-t"
              aria-describedby="pop-d"
              style={{
                maxWidth: "440px",
                width: "100%",
                alignItems: "center",
                textAlign: "center",
                gap: "14px",
                padding: "32px 28px 28px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.85)",
                  boxShadow: "0 14px 22px -12px rgba(60,72,130,.4)",
                }}
              >
                <svg width="52" height="52" viewBox="0 0 256 256" aria-hidden="true">
                  <rect x="28" y="52" width="200" height="152" rx="28" fill="#CDBFF7" />
                  <path
                    d="M40 84 L128 146 L216 84"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="206" cy="62" r="26" fill="#7CCBAE" />
                  <path
                    d="M194 62 L202 70 L218 54"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h2 id="pop-t" className="ie-h2">
                이음쌤에게 쪽지를 보냈어요
              </h2>
              <p id="pop-d" className="ie-body">
                이음쌤이 읽고 답해요. 답이 오면 알림으로 알려 줘요. 바로 답이 오지 않을 수 있어요.
              </p>
              <div className="ie-row" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="ie-btn ie-btn--primary ie-btn--lg"
                  onClick={v.closePop}
                >
                  확인
                </button>
                <A className="ie-btn ie-btn--outline ie-btn--lg" href={ROUTES.messages}>
                  내 쪽지함 보기
                </A>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
