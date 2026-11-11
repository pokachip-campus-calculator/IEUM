/**
 * S05 홈
 * (원본 디자인: Home.dc.html)
 */
import { Component, Fragment } from "react";
import { session } from "@/api";
import type { HomeResponse } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import { startVillage } from "./village3d";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./Home.css?inline";
import ComfortRotator from "@/components/ComfortRotator/ComfortRotator";

export default class Home extends Component<any, any> {
  [key: string]: any;

  componentDidMount() {
    startVillage.call(this);
  }
  componentWillUnmount() {
    if (this.__w3off) this.__w3off();
  }

  renderVals() {
    return {};
  }

  render() {
    const v: any = this.renderVals();
    const home = this.props.home as HomeResponse | undefined;
    const resume = home?.resume;
    const resumeAction = resume
      ? resume.myStatus === "IN_PROGRESS"
        ? "이어서 할 연습 확인하기"
        : "시작할 연습 확인하기"
      : "모든 연습 살펴보기";
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell ie-home">
          <div className="ie-body-row">
            <main className="ie-main ie-w3main">
              <section className="ie-w3 ie-in" aria-labelledby="home-h">
                <img className="ie-w3sky" src={img.villageBg} alt="" draggable="false" />
                <ComfortRotator />
                <div className="ie-w3head">
                  <h1 id="home-h" className="ie-title">
                    {(session.user.nick || home?.nickname || "친구")}님, 반가워요.
                  </h1>
                  <p className="ie-body-lg ie-sub">스크롤로 마을의 장소를 하나씩 둘러보고, 드래그해서 마을을 돌려 보세요.</p>
                  <div className="ie-row" style={{ marginTop: "14px", pointerEvents: "auto" }}>
                    <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.areas}>
                      {resumeAction}
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </A>
                  </div>
                  {home ? (
                    <p className="ie-meta" style={{ marginTop: "8px" }}>
                      {resume
                        ? `${resume.title} · ${
                            resume.myStatus === "IN_PROGRESS" ? "이어서 할 연습" : "새로 시작할 연습"
                          }`
                        : "모든 연습을 마쳤어요"}
                      {" · 완료한 연습 "}
                      {home.doneTotal}개
                    </p>
                  ) : null}
                </div>
                <p className="ie-w3hint" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      d="M9 6l-6 6 6 6M15 6l6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  스크롤로 장소를 하나씩 보고, 드래그해서 마을을 돌려 보세요
                </p>
                <div
                  className="ie-w3stage ie-3stage"
                  tabIndex={0}
                  role="group"
                  aria-roledescription="3D 마을"
                  aria-label="이음 마을. 마우스 휠이나 화살표 키로 장소를 하나씩 보고, 끌어서 마을을 돌려 보세요. 확대·축소는 두 손가락 벌리기나 오른쪽 아래 버튼으로 할 수 있어요."
                >
                  <div className="ie-3map" aria-hidden="true">
                    <img
                      className="ie-3fr"
                      src={img.villageFrame1}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame2}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame3}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame4}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame5}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame6}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame7}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                    <img
                      className="ie-3fr"
                      src={img.villageFrame8}
                      alt=""
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                  <div className="ie-3labs">
                    <A
                      className="ie-3lab"
                      data-k="0"
                      href={ROUTES.areas}
                      draggable="false"
                      style={{ "--c": "#8E7CE0", "--soft": "#EEE9FF" } as CSSProperties}
                      aria-label="학습 영역"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M3 5.5 C6 4.5 9 4.6 12 6.4 V20 C9 18.4 6 18.3 3 19.2Z"
                            fill="#B7A6EE"
                          />
                          <path
                            d="M21 5.5 C18 4.5 15 4.6 12 6.4 V20 C15 18.4 18 18.3 21 19.2Z"
                            fill="#9D8BE3"
                          />
                        </svg>
                      </span>
                      <span className="ie-3lnm">학습 영역</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="1"
                      href={ROUTES.help}
                      draggable="false"
                      style={{ "--c": "#E27FAE", "--soft": "#FFE9F3" } as CSSProperties}
                      aria-label="도움 받을 수 있는 곳"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M12 21 C5 16 2 12.5 2 8.6 C2 5.5 4.4 3.2 7.2 3.2 C9.2 3.2 11 4.3 12 6 C13 4.3 14.8 3.2 16.8 3.2 C19.6 3.2 22 5.5 22 8.6 C22 12.5 19 16 12 21Z"
                            fill="#F2A7C6"
                          />
                        </svg>
                      </span>
                      <span className="ie-3lnm">도움 받을 수 있는 곳</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="2"
                      href={ROUTES.talk}
                      draggable="false"
                      style={{ "--c": "#52B99C", "--soft": "#E3F7EF" } as CSSProperties}
                      aria-label="이음상담소"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M4 5 H20 C21 5 21.6 5.6 21.6 6.6 V15 C21.6 16 21 16.6 20 16.6 H10 L6 20 V16.6 H4 C3 16.6 2.4 16 2.4 15 V6.6 C2.4 5.6 3 5 4 5Z"
                            fill="#7FCDB4"
                          />
                          <circle cx="8" cy="10.8" r="1.4" fill="#FFFFFF" />
                          <circle cx="12" cy="10.8" r="1.4" fill="#FFFFFF" />
                          <circle cx="16" cy="10.8" r="1.4" fill="#FFFFFF" />
                        </svg>
                      </span>
                      <span className="ie-3lnm">이음상담소</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="3"
                      href={ROUTES.messages}
                      draggable="false"
                      style={{ "--c": "#5BA9DA", "--soft": "#E4F3FD" } as CSSProperties}
                      aria-label="내 쪽지함"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <rect x="3" y="6" width="18" height="13" rx="2.5" fill="#8EC6EC" />
                          <path
                            d="M3.8 7.2 L12 13 L20.2 7.2"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="ie-3lnm">내 쪽지함</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="4"
                      href={ROUTES.notifications}
                      draggable="false"
                      style={{ "--c": "#E0AB3C", "--soft": "#FFF4D8" } as CSSProperties}
                      aria-label="알림"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path
                            d="M12 3 C8.4 3 6.5 5.8 6.5 9 V13 L4.5 16.5 H19.5 L17.5 13 V9 C17.5 5.8 15.6 3 12 3Z"
                            fill="#F4C766"
                          />
                          <circle cx="12" cy="19.2" r="2.2" fill="#E0A93C" />
                        </svg>
                      </span>
                      <span className="ie-3lnm">알림</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="5"
                      href={ROUTES.collection}
                      draggable="false"
                      style={{ "--c": "#7C93E8", "--soft": "#EAF0FF" } as CSSProperties}
                      aria-label="내 학습 기록"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M12 3 L20 9 L12 21 L4 9Z" fill="#9FB4F0" />
                          <path
                            d="M4 9 H20 M9 9 L12 21 M15 9 L12 21 M9 9 L12 3 M15 9 L12 3"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="ie-3lnm">내 학습 기록</span>
                    </A>
                    <A
                      className="ie-3lab"
                      data-k="6"
                      href={ROUTES.profile}
                      draggable="false"
                      style={{ "--c": "#5FB1CF", "--soft": "#E3F4FA" } as CSSProperties}
                      aria-label="내 정보"
                    >
                      <span className="ie-3lic">
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <circle cx="12" cy="8.4" r="4" fill="#8FCBE0" />
                          <path
                            d="M4.5 20 C5.5 15.5 8.5 13.6 12 13.6 C15.5 13.6 18.5 15.5 19.5 20Z"
                            fill="#8FCBE0"
                          />
                        </svg>
                      </span>
                      <span className="ie-3lnm">내 정보</span>
                    </A>
                  </div>
                  <div className="ie-3zoom" role="group" aria-label="확대·축소">
                    <button type="button" className="ie-3zb" data-z="in" aria-label="확대">
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 5v14M5 12h14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button type="button" className="ie-3zb" data-z="out" aria-label="축소">
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M5 12h14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="ie-3zb"
                      data-z="all"
                      aria-label="마을 전체 보기"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="ie-w3dock">
                  <div className="ie-w3row">
                    <button
                      type="button"
                      className="ie-w3nav ie-w3nav--prev"
                      aria-label="이전 장소"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M15 5l-7 7 7 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <div className="ie-w3card">
                      <div
                        className="ie-w3item"
                        data-k="0"
                        style={{ "--c": "#7C8BD8", "--soft": "#ECEFFF" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path
                              d="M4 7l5-2 6 2 5-2v12l-5 2-6-2-5 2z M9 5v12 M15 7v12"
                              fill="none"
                              stroke="#7C8BD8"
                              strokeWidth="1.9"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">이음 마을</b>
                          <span className="ie-w3ds">스크롤하면 한 곳씩 가까이 가요.</span>
                        </span>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="1"
                        style={{ "--c": "#8E7CE0", "--soft": "#EEE9FF" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path
                              d="M3 5.5 C6 4.5 9 4.6 12 6.4 V20 C9 18.4 6 18.3 3 19.2Z"
                              fill="#B7A6EE"
                            />
                            <path
                              d="M21 5.5 C18 4.5 15 4.6 12 6.4 V20 C15 18.4 18 18.3 21 19.2Z"
                              fill="#9D8BE3"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">학습 영역</b>
                          <span className="ie-w3ds">연습할 상황을 골라요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.areas}
                          tabIndex={-1}
                          aria-label="학습 영역 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="2"
                        style={{ "--c": "#E27FAE", "--soft": "#FFE9F3" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path
                              d="M12 21 C5 16 2 12.5 2 8.6 C2 5.5 4.4 3.2 7.2 3.2 C9.2 3.2 11 4.3 12 6 C13 4.3 14.8 3.2 16.8 3.2 C19.6 3.2 22 5.5 22 8.6 C22 12.5 19 16 12 21Z"
                              fill="#F2A7C6"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">도움 받을 수 있는 곳</b>
                          <span className="ie-w3ds">전화·상담 연락처를 찾아봐요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.help}
                          tabIndex={-1}
                          aria-label="도움 받을 수 있는 곳 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="3"
                        style={{ "--c": "#52B99C", "--soft": "#E3F7EF" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path
                              d="M4 5 H20 C21 5 21.6 5.6 21.6 6.6 V15 C21.6 16 21 16.6 20 16.6 H10 L6 20 V16.6 H4 C3 16.6 2.4 16 2.4 15 V6.6 C2.4 5.6 3 5 4 5Z"
                              fill="#7FCDB4"
                            />
                            <circle cx="8" cy="10.8" r="1.4" fill="#FFFFFF" />
                            <circle cx="12" cy="10.8" r="1.4" fill="#FFFFFF" />
                            <circle cx="16" cy="10.8" r="1.4" fill="#FFFFFF" />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">이음상담소</b>
                          <span className="ie-w3ds">이음쌤과 이야기해요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.talk}
                          tabIndex={-1}
                          aria-label="이음상담소 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="4"
                        style={{ "--c": "#5BA9DA", "--soft": "#E4F3FD" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <rect x="3" y="6" width="18" height="13" rx="2.5" fill="#8EC6EC" />
                            <path
                              d="M3.8 7.2 L12 13 L20.2 7.2"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">내 쪽지함</b>
                          <span className="ie-w3ds">보낸 쪽지와 답변을 모아 봐요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.messages}
                          tabIndex={-1}
                          aria-label="내 쪽지함 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="5"
                        style={{ "--c": "#E0AB3C", "--soft": "#FFF4D8" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path
                              d="M12 3 C8.4 3 6.5 5.8 6.5 9 V13 L4.5 16.5 H19.5 L17.5 13 V9 C17.5 5.8 15.6 3 12 3Z"
                              fill="#F4C766"
                            />
                            <circle cx="12" cy="19.2" r="2.2" fill="#E0A93C" />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">알림</b>
                          <span className="ie-w3ds">새 소식을 확인해요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.notifications}
                          tabIndex={-1}
                          aria-label="알림 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="6"
                        style={{ "--c": "#7C93E8", "--soft": "#EAF0FF" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <path d="M12 3 L20 9 L12 21 L4 9Z" fill="#9FB4F0" />
                            <path
                              d="M4 9 H20 M9 9 L12 21 M15 9 L12 21 M9 9 L12 3 M15 9 L12 3"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1.3"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">내 학습 기록</b>
                          <span className="ie-w3ds">내가 모은 보석을 봐요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.collection}
                          tabIndex={-1}
                          aria-label="내 학습 기록 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                      <div
                        className="ie-w3item"
                        data-k="7"
                        style={{ "--c": "#5FB1CF", "--soft": "#E3F4FA" } as CSSProperties}
                      >
                        <span className="ie-w3ico">
                          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                            <circle cx="12" cy="8.4" r="4" fill="#8FCBE0" />
                            <path
                              d="M4.5 20 C5.5 15.5 8.5 13.6 12 13.6 C15.5 13.6 18.5 15.5 19.5 20Z"
                              fill="#8FCBE0"
                            />
                          </svg>
                        </span>
                        <span className="ie-w3txt">
                          <b className="ie-w3nm">내 정보</b>
                          <span className="ie-w3ds">내 이름과 설정을 봐요.</span>
                        </span>
                        <A
                          className="ie-btn ie-btn--primary ie-w3go"
                          href={ROUTES.profile}
                          tabIndex={-1}
                          aria-label="내 정보 들어가기"
                        >
                          <span className="ie-w3gt">들어가기</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </A>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ie-w3nav ie-w3nav--next"
                      aria-label="다음 장소"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M9 5l7 7-7 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="ie-w3dots">
                    <button type="button" className="ie-w3dot" data-k="0" aria-label="마을 전체" />
                    <button type="button" className="ie-w3dot" data-k="1" aria-label="학습 영역" />
                    <button
                      type="button"
                      className="ie-w3dot"
                      data-k="2"
                      aria-label="도움 받을 수 있는 곳"
                    />
                    <button type="button" className="ie-w3dot" data-k="3" aria-label="이음상담소" />
                    <button type="button" className="ie-w3dot" data-k="4" aria-label="내 쪽지함" />
                    <button type="button" className="ie-w3dot" data-k="5" aria-label="알림" />
                    <button
                      type="button"
                      className="ie-w3dot"
                      data-k="6"
                      aria-label="내 학습 기록"
                    />
                    <button type="button" className="ie-w3dot" data-k="7" aria-label="내 정보" />
                  </div>
                </div>
                <p className="ie-w3live ie-sr" aria-live="polite" />
              </section>
            </main>
          </div>
        </div>
      </>
    );
  }
}
