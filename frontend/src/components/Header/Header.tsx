/**
 * 공통 헤더
 * (원본 디자인: Header.dc.html)
 */
import { Component, Fragment } from "react";
import { clearSessionUser, session } from "@/api";
import { A } from "@/lib/A";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import { badgeService } from "@/api/services/badgeService";
import { BADGE_COUNTS_CHANGED } from "@/api/services/badgeEvents";
import SideNav from "@/components/SideNav/SideNav";
import TeacherNav from "@/components/TeacherNav/TeacherNav";
import "./Header.css";

export default class Header extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { open: false, unreadNotifications: 0, unreadReplies: 0 };
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
      (counts) => this.setState(counts),
      (error) => console.error("메뉴 배지 정보를 불러오지 못했습니다:", error),
    );
  }
  renderVals() {
    const open = this.state.open;
    const nickname = session.user.nick || "이음쌤";
    return {
      active: this.props.active ?? "home",
      isLearner: (this.props.role ?? "learner") === "learner",
      isTeacher: (this.props.role ?? "learner") === "teacher",
      isGuest: (this.props.role ?? "learner") === "guest",
      nickname,
      showMenu: ["guest", "guest-plain"].indexOf(this.props.role ?? "learner") < 0,
      logoHref:
        ["guest", "guest-plain"].indexOf(this.props.role ?? "learner") >= 0
          ? ROUTES.landing
          : this.props.role === "teacher"
            ? ROUTES.teacher
            : ROUTES.home,
      logoLabel:
        ["guest", "guest-plain"].indexOf(this.props.role ?? "learner") >= 0
          ? "이음 처음 화면으로"
          : "이음 홈으로",
      open,
      unreadNotifications: this.state.unreadNotifications,
      unreadReplies: this.state.unreadReplies,
      closed: !open,
      menuLabel: open ? "메뉴 닫기" : "메뉴 열기",
      toggle: () => this.setState({ open: !open }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root" style={{ background: "#FFFFFF", width: "100%" }}>
        <header className="ie-header">
          {v.showMenu ? (
            <button
              type="button"
              className="ie-iconbtn ie-only-narrow"
              aria-label={v.menuLabel}
              aria-expanded={v.open}
              aria-controls="ie-drawer"
              onClick={v.toggle}
            >
              {v.closed ? (
                <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                  <path d="M216,64V192H40V64Z" fill="#E1E6F2" />
                  <path
                    d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"
                    fill="#28334C"
                  />
                </svg>
              ) : null}{" "}
              {v.open ? (
                <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
                  <path
                    d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
                    fill="#28334C"
                  />
                </svg>
              ) : null}
            </button>
          ) : null}{" "}
          <A className="ie-logo" href={v.logoHref} aria-label={v.logoLabel}>
            <img
              src={img.logo}
              alt="이음"
              style={{ height: "56px", width: "auto", display: "block", margin: "-8px 0" }}
            />
          </A>{" "}
          <span className="ie-meta ie-hide-mobile" style={{ marginLeft: "8px" }}>
            오늘도 나의 속도로
          </span>{" "}
          <span className="ie-header-spacer" />
          <div className="ie-header-actions">
            {v.isGuest ? (
              <A
                className="ie-btn ie-btn--primary"
                style={{ color: "#FFFFFF" }}
                href={ROUTES.login}
              >
                로그인
              </A>
            ) : null}{" "}
            {v.isLearner ? (
              <>
                <A
                  className="ie-bell ie-hide-mobile"
                  href={ROUTES.notifications}
                  aria-label={`알림 · 안 읽은 알림 ${v.unreadNotifications}개`}
                >
                  <svg width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
                    <path
                      d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                      fill="#D9CFFF"
                    />
                    <path
                      d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                      fill="#4E3FA6"
                    />
                  </svg>
                  {v.unreadNotifications > 0 ? (
                    <span className="ie-bell-n" aria-hidden="true">
                      {v.unreadNotifications}
                    </span>
                  ) : null}
                </A>{" "}
                <A
                  className="ie-btn ie-btn--outline ie-hide-mobile"
                  href={ROUTES.talk}
                  aria-label={`이음상담소 · 새 답변 ${v.unreadReplies}개`}
                >
                  <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                    <path
                      d="M224,128A96,96,0,0,1,79.93,211.11h0L42.54,223.58a8,8,0,0,1-10.12-10.12l12.47-37.39h0A96,96,0,1,1,224,128Z"
                      fill="#AEE3EE"
                    />
                    <path
                      d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-4-1.08,7.85,7.85,0,0,0-2.53.42L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-44,0a12,12,0,1,1-12-12A12,12,0,0,1,96,128Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,128Z"
                      fill="#23606F"
                    />
                  </svg>
                  {"이음상담소 "}
                  {v.unreadReplies > 0 ? (
                    <span className="ie-newtag">{v.unreadReplies}</span>
                  ) : null}
                </A>{" "}
                <A
                  className="ie-row ie-hide-mobile"
                  href={ROUTES.profile}
                  aria-label="내 정보"
                  style={{
                    gap: "10px",
                    paddingLeft: "4px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className="ie-avatar" aria-hidden="true">
                    {session.user.nick.slice(0, 1)}
                  </span>
                  <span className="ie-body ie-strong">{session.user.nick}님</span>
                </A>
              </>
            ) : null}{" "}
            {v.isTeacher ? (
              <>
                <A
                  className="ie-bell ie-hide-mobile"
                  href={ROUTES.notifications}
                  aria-label={`알림 · 안 읽은 알림 ${v.unreadNotifications}개`}
                >
                  <svg width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
                    <path
                      d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                      fill="#D9CFFF"
                    />
                    <path
                      d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                      fill="#4E3FA6"
                    />
                  </svg>
                  {v.unreadNotifications > 0 ? (
                    <span className="ie-bell-n" aria-hidden="true">
                      {v.unreadNotifications}
                    </span>
                  ) : null}
                </A>{" "}
                <span
                  className="ie-row ie-hide-mobile"
                  style={{
                    gap: "10px",
                    paddingLeft: "4px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className="ie-avatar" aria-hidden="true">
                    {v.nickname.slice(0, 1)}
                  </span>
                  <span className="ie-body ie-strong">{v.nickname}님</span>
                </span>{" "}
                <A
                  className="ie-btn ie-btn--outline ie-hide-mobile"
                  href={ROUTES.login}
                  onClick={clearSessionUser}
                >
                  로그아웃
                </A>
              </>
            ) : null}
          </div>
          {v.open ? (
            <div id="ie-drawer" className="ie-drawer">
              {v.isLearner ? (
                <SideNav active={v.active} />
              ) : null}{" "}
              {v.isTeacher ? (
                <TeacherNav active={v.active} unreadNotifications={v.unreadNotifications} />
              ) : null}
            </div>
          ) : null}
        </header>
      </div>
    );
  }
}
