/**
 * 이음쌤 사이드 메뉴
 * (원본 디자인: TeacherNav.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import { ROUTES } from "@/routes";

export default class TeacherNav extends Component<any, any> {
  [key: string]: any;

  renderVals() {
    const a = this.props.active ?? "teacher";
    const cur: any = {};
    ["teacher", "tmsg", "tsig", "tupl", "noti"].forEach((k) => {
      cur[k] = a === k ? "page" : "false";
    });
    return { cur };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root" style={{ background: "#FFFFFF", width: "100%" }}>
        <nav className="ie-sidenav" aria-label="이음쌤 메뉴">
          <ul className="ie-navlist">
            <li>
              <A className="ie-navlink" href={ROUTES.teacher} aria-current={v.cur.teacher}>
                <span className="ie-navicon" style={{ background: "#EDF6FF" }}>
                  <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                    <path
                      d="M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z"
                      fill="#BFDDFF"
                    />
                    <path
                      d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"
                      fill="#3F4F94"
                    />
                  </svg>
                </span>
                이음쌤 홈
              </A>
            </li>
            <li>
              <A className="ie-navlink" href={ROUTES.teacherMessages} aria-current={v.cur.tmsg}>
                <span className="ie-navicon" style={{ background: "#E9F7FA" }}>
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
                </span>
                {"쪽지 모아 보기 "}
                <span
                  className="ie-newtag"
                  style={{ marginLeft: "8px" }}
                  aria-label="답장이 필요한 쪽지 2개"
                >
                  2
                </span>
              </A>
            </li>
            <li>
              <A className="ie-navlink" href={ROUTES.teacherSignal} aria-current={v.cur.tsig}>
                <span className="ie-navicon" style={{ background: "#FFF3EC" }}>
                  <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
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
                {"신호 대응 기록 "}
                <span
                  className="ie-newtag"
                  style={{ marginLeft: "8px" }}
                  aria-label="확인이 필요한 신호 1개"
                >
                  1
                </span>
              </A>
            </li>
            <li>
              <A className="ie-navlink" href={ROUTES.teacherUpload} aria-current={v.cur.tupl}>
                <span className="ie-navicon" style={{ background: "#ECF7F2" }}>
                  <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                    <path d="M40,152H216v56a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8Z" fill="#B8E6D3" />
                    <path
                      d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V152a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"
                      fill="#2A6A52"
                    />
                  </svg>
                </span>
                강의 자료 올리기
              </A>
            </li>
            <li>
              <A className="ie-navlink" href={ROUTES.notifications} aria-current={v.cur.noti}>
                <span className="ie-navicon" style={{ background: "#FFF4D6" }}>
                  <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                    <path
                      d="M208,192H48a8,8,0,0,1-6.88-12C47.63,168.91,56,144.24,56,104a72,72,0,0,1,144,0c0,40.24,8.37,64.91,14.88,76A8,8,0,0,1,208,192Z"
                      fill="#FFE7A3"
                    />
                    <path
                      d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                      fill="#7A5300"
                    />
                  </svg>
                </span>
                {"알림 "}
                <span
                  className="ie-newtag"
                  style={{ marginLeft: "8px" }}
                  aria-label="안 읽은 알림 3개"
                >
                  3
                </span>
              </A>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}
