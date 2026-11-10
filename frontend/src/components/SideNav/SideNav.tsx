/**
 * 학습자 사이드 메뉴
 * (원본 디자인: SideNav.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import { ROUTES } from "@/routes";
import {
  badgeService,
  type BadgeCounts,
} from "@/api/services/badgeService";
import { BADGE_COUNTS_CHANGED } from "@/api/services/badgeEvents";
import "./SideNav.css";

export default class SideNav extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { unreadNotifications: 0, unreadReplies: 0 };
  }

  componentDidMount() {
    window.addEventListener(BADGE_COUNTS_CHANGED, this.refreshBadges);
    this.refreshBadges();
  }

  componentWillUnmount() {
    window.removeEventListener(BADGE_COUNTS_CHANGED, this.refreshBadges);
  }

  refreshBadges = () => {
    badgeService.getCounts().then(
      (counts: BadgeCounts) => this.setState(counts),
      (error) => console.error("메뉴 배지 정보를 불러오지 못했습니다:", error),
    );
  }

  renderVals() {
    const a = this.props.active ?? "home";
    const keys = ["home", "areas", "collection", "talk", "messages", "noti", "help", "profile"];
    const inAreas = a === "unit" || a === "scenario" || a === "emotion";
    // 지금 보고 있는 메뉴(또는 그 상위 메뉴)인지
    const on = (k) => a === k || (k === "areas" && inAreas);
    const cur: any = {},
      c: any = {},
      t: any = {},
      tcur: any = {};
    keys.forEach((k) => {
      cur[k] = a === k ? "page" : on(k) ? "true" : "false";
      c[k] = on(k) ? "ie-sn-link is-on" : "ie-sn-link";
      // 하단 탭: 쪽지함은 이음상담소 탭 아래로 묶어서 보여줘요
      const tOn = on(k) || (k === "talk" && a === "messages");
      t[k] = tOn ? "ie-sn-tab is-on" : "ie-sn-tab";
      tcur[k] = a === k ? "page" : tOn ? "true" : "false";
    });
    return {
      cur,
      c,
      t,
      tcur,
      unreadNotifications: this.state.unreadNotifications,
      unreadReplies: this.state.unreadReplies,
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-sn-root" style={{ background: "transparent", width: "100%" }}>
        <nav className="ie-sn ie-sn-full" aria-label="주요 메뉴">
          <div className="ie-sn-group">
            <p className="ie-sn-label" aria-hidden="true">
              MAIN
            </p>
            <ul className="ie-sn-list" aria-label="메인">
              <li>
                <A
                  className={v.c.home}
                  href={ROUTES.home}
                  aria-current={v.cur.home}
                  data-label="홈"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">홈</span>
                </A>
              </li>
              <li>
                <A
                  className={v.c.areas}
                  href={ROUTES.areas}
                  aria-current={v.cur.areas}
                  data-label="학습 영역"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M224,200a24,24,0,1,1-24-24A24,24,0,0,1,224,200Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M200,168a32.06,32.06,0,0,0-31,24H72a32,32,0,0,1,0-64h96a40,40,0,0,0,0-80H72a8,8,0,0,0,0,16h96a24,24,0,0,1,0,48H72a48,48,0,0,0,0,96h97a32,32,0,1,0,31-40Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,200,216Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">학습 영역</span>
                </A>
              </li>
              <li>
                <A
                  className={v.c.collection}
                  href={ROUTES.collection}
                  aria-current={v.cur.collection}
                  data-label="내 학습 기록"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M240,104,128,224,80,104l48-64h56Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M246,98.73l-56-64A8,8,0,0,0,184,32H72a8,8,0,0,0-6,2.73l-56,64a8,8,0,0,0,.17,10.73l112,120a8,8,0,0,0,11.7,0l112-120A8,8,0,0,0,246,98.73ZM222.37,96H180L144,48h36.37ZM74.58,112l30.13,75.33L34.41,112Zm89.6,0L128,202.46,91.82,112ZM96,96l32-42.67L160,96Zm85.42,16h40.17l-70.3,75.33ZM75.63,48H112L76,96H33.63Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">내 학습 기록</span>
                </A>
              </li>
            </ul>
          </div>
          <div className="ie-sn-group">
            <p className="ie-sn-label" aria-hidden="true">
              COMMUNICATION
            </p>
            <ul className="ie-sn-list" aria-label="소통">
              <li>
                <A
                  className={v.c.talk}
                  href={ROUTES.talk}
                  aria-current={v.cur.talk}
                  data-label="이음상담소"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M224,128A96,96,0,0,1,79.93,211.11h0L42.54,223.58a8,8,0,0,1-10.12-10.12l12.47-37.39h0A96,96,0,1,1,224,128Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-4-1.08,7.85,7.85,0,0,0-2.53.42L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-44,0a12,12,0,1,1-12-12A12,12,0,0,1,96,128Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,128Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">이음상담소</span>
                  {v.unreadReplies > 0 ? (
                    <span className="ie-newtag" aria-label={`새 답변 ${v.unreadReplies}개`}>
                      {v.unreadReplies}
                    </span>
                  ) : null}
                </A>
              </li>
              <li>
                <A
                  className={v.c.messages}
                  href={ROUTES.messages}
                  aria-current={v.cur.messages}
                  data-label="내 쪽지함"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path d="M32,56H224V192H32Z" fill="currentColor" opacity=".26" />
                      <path
                        d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">내 쪽지함</span>
                </A>
              </li>
              <li>
                <A
                  className={v.c.noti}
                  href={ROUTES.notifications}
                  aria-current={v.cur.noti}
                  data-label="알림"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">알림</span>
                  {v.unreadNotifications > 0 ? (
                    <span
                      className="ie-newtag"
                      aria-label={`안 읽은 알림 ${v.unreadNotifications}개`}
                    >
                      {v.unreadNotifications}
                    </span>
                  ) : null}
                </A>
              </li>
            </ul>
          </div>
          <div className="ie-sn-group">
            <p className="ie-sn-label" aria-hidden="true">
              SUPPORT
            </p>
            <ul className="ie-sn-list" aria-label="지원">
              <li>
                <A
                  className={v.c.help}
                  href={ROUTES.help}
                  aria-current={v.cur.help}
                  data-label="도움 받을 수 있는 곳"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M128,216S24,160,24,92A52,52,0,0,1,76,40c21.65,0,40.34,11.22,52,30.8C139.66,51.22,158.35,40,180,40a52,52,0,0,1,52,52C232,160,128,216,128,216Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">도움 받을 수 있는 곳</span>
                </A>
              </li>
              <li>
                <A
                  className={v.c.profile}
                  href={ROUTES.profile}
                  aria-current={v.cur.profile}
                  data-label="내 정보"
                >
                  <span className="ie-sn-ic">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path
                        d="M192,96a64,64,0,1,1-64-64A64,64,0,0,1,192,96Z"
                        fill="currentColor"
                        opacity=".26"
                      />
                      <path
                        d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="ie-sn-txt">내 정보</span>
                </A>
              </li>
            </ul>
          </div>
        </nav>
        <nav className="ie-sn-tabs" aria-label="하단 메뉴">
          <A className={v.t.home} href={ROUTES.home} aria-current={v.tcur.home}>
            <span className="ie-sn-tic">
              <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                <path
                  d="M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z"
                  fill="currentColor"
                  opacity=".26"
                />
                <path
                  d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="ie-sn-ttx">홈</span>
          </A>{" "}
          <A className={v.t.areas} href={ROUTES.areas} aria-current={v.tcur.areas}>
            <span className="ie-sn-tic">
              <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                <path
                  d="M224,200a24,24,0,1,1-24-24A24,24,0,0,1,224,200Z"
                  fill="currentColor"
                  opacity=".26"
                />
                <path
                  d="M200,168a32.06,32.06,0,0,0-31,24H72a32,32,0,0,1,0-64h96a40,40,0,0,0,0-80H72a8,8,0,0,0,0,16h96a24,24,0,0,1,0,48H72a48,48,0,0,0,0,96h97a32,32,0,1,0,31-40Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,200,216Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="ie-sn-ttx">학습 영역</span>
          </A>{" "}
          <A className={v.t.collection} href={ROUTES.collection} aria-current={v.tcur.collection}>
            <span className="ie-sn-tic">
              <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                <path d="M240,104,128,224,80,104l48-64h56Z" fill="currentColor" opacity=".26" />
                <path
                  d="M246,98.73l-56-64A8,8,0,0,0,184,32H72a8,8,0,0,0-6,2.73l-56,64a8,8,0,0,0,.17,10.73l112,120a8,8,0,0,0,11.7,0l112-120A8,8,0,0,0,246,98.73ZM222.37,96H180L144,48h36.37ZM74.58,112l30.13,75.33L34.41,112Zm89.6,0L128,202.46,91.82,112ZM96,96l32-42.67L160,96Zm85.42,16h40.17l-70.3,75.33ZM75.63,48H112L76,96H33.63Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="ie-sn-ttx">내 학습 기록</span>
          </A>{" "}
          <A className={v.t.talk} href={ROUTES.talk} aria-current={v.tcur.talk}>
            <span className="ie-sn-tic">
              <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                <path
                  d="M224,128A96,96,0,0,1,79.93,211.11h0L42.54,223.58a8,8,0,0,1-10.12-10.12l12.47-37.39h0A96,96,0,1,1,224,128Z"
                  fill="currentColor"
                  opacity=".26"
                />
                <path
                  d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-4-1.08,7.85,7.85,0,0,0-2.53.42L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-44,0a12,12,0,1,1-12-12A12,12,0,0,1,96,128Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,128Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="ie-sn-ttx">이음상담소</span>
            {v.unreadReplies > 0 ? (
              <span className="ie-newtag" aria-label={`새 답변 ${v.unreadReplies}개`}>
                {v.unreadReplies}
              </span>
            ) : null}
          </A>{" "}
          <A className={v.t.noti} href={ROUTES.notifications} aria-current={v.tcur.noti}>
            <span className="ie-sn-tic">
              <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                <path
                  d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                  fill="currentColor"
                  opacity=".26"
                />
                <path
                  d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                  fill="currentColor"
                />
              </svg>
              {v.unreadNotifications > 0 ? (
                <span
                  className="ie-newtag"
                  aria-label={`안 읽은 알림 ${v.unreadNotifications}개`}
                >
                  {v.unreadNotifications}
                </span>
              ) : null}
            </span>
            <span className="ie-sn-ttx">알림</span>
          </A>
        </nav>
      </div>
    );
  }
}
