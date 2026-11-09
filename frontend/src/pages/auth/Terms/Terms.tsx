/**
 * S04 약관 전문
 * (원본 디자인: Terms.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";

export default class Terms extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { tab: "terms" };
  }
  renderVals() {
    const s = this.state;
    const D: any = this.props.docs;
    return {
      tabs: [
        ["terms", "이음 이용 약관"],
        ["privacy", "개인정보 수집 및 이용"],
      ].map((t) => ({ label: t[1], on: s.tab === t[0], pick: () => this.setState({ tab: t[0] }) })),
      cur: D[s.tab],
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
          <main className="ie-main" style={{ margin: "0 auto", width: "100%" }}>
            <div className="ie-su" style={{ maxWidth: "880px" }}>
              <section
                className="ie-banner ie-banner--mint ie-in"
                style={{ minHeight: "150px", width: "100%" }}
              >
                <div className="ie-banner-text" style={{ maxWidth: "520px" }}>
                  <h1 className="ie-title">약관 전문</h1>
                  <p className="ie-body-lg ie-sub">
                    가입 전에 천천히 읽어 보세요. 이해가 어려우면 보호자나 믿을 수 있는 어른과 함께
                    읽어도 돼요.
                  </p>
                </div>
                <div className="ie-banner-art ie-fade-l">
                  <img className="ie-3img" src={img.bannerTalk} alt="" draggable="false" />
                </div>
              </section>
              <div
                className="ie-seg"
                role="tablist"
                aria-label="약관 종류"
                style={{ alignSelf: "center" }}
              >
                {(v.tabs || []).map((t: any, __i0: number) => (
                  <Fragment key={__i0}>
                    <button type="button" role="tab" aria-selected={t.on} onClick={t.pick}>
                      {t.label}
                    </button>
                  </Fragment>
                ))}
              </div>
              <section
                className="ie-card"
                role="tabpanel"
                aria-labelledby="tm-h"
                style={{ gap: "18px" }}
              >
                <h2 id="tm-h" className="ie-h2">
                  {v.cur.title}
                </h2>
                <div className="ie-card ie-card--lav" style={{ gap: "8px" }}>
                  <b className="ie-body ie-strong">쉬운 요약</b>
                  <ul
                    className="ie-stack-s"
                    style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                  >
                    {(v.cur.summary || []).map((x: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li className="ie-body">{x}</li>
                      </Fragment>
                    ))}
                  </ul>
                </div>
                {(v.cur.clauses || []).map((c: any, __i0: number) => (
                  <Fragment key={__i0}>
                    <div className="ie-stack-s" style={{ gap: "4px" }}>
                      <b className="ie-h3">{c.t}</b>
                      {c.hasRows ? (
                        <div style={{ overflowX: "auto" }}>
                          <table className="ie-table">
                            <thead>
                              <tr>
                                <th scope="col">수집 목적</th>
                                <th scope="col">수집 항목</th>
                                <th scope="col">보유 및 이용 기간</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(c.rows || []).map((r: any, __i1: number) => (
                                <Fragment key={__i1}>
                                  <tr>
                                    <td>{r.a}</td>
                                    <td>{r.b}</td>
                                    <td>{r.c}</td>
                                  </tr>
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}{" "}
                      {(c.ps || []).map((x: any, __i1: number) => (
                        <Fragment key={__i1}>
                          <p className="ie-body ie-sub">{x}</p>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
                <div className="ie-stack-s" style={{ gap: "8px" }}>
                  <b className="ie-body ie-strong">읽은 뒤 돌아가기</b>
                  <div className="ie-row" style={{ gap: "12px", flexWrap: "wrap" }}>
                    <A className="ie-btn ie-btn--primary ie-btn--lg" href={ROUTES.signup}>
                      가입 화면으로
                    </A>
                    <A className="ie-btn ie-btn--outline ie-btn--lg" href={ROUTES.profile}>
                      내 정보로 (학습자)
                    </A>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
