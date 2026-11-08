/**
 * S10 내 학습 기록
 * (원본 디자인: Collection.dc.html)
 */
import { Component, Fragment } from "react";
import { A } from "@/lib/A";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import SideNav from "@/components/SideNav/SideNav";
import Gem from "@/components/Gem/Gem";

export default class Collection extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = { view: "all", lv: -1, cat: "", stt: "", sort: "new", open: null };
  }
  renderVals() {
    const s = this.state;
    const LV: any = [
      ["opal", "오팔"],
      ["aqua", "아쿠아마린"],
      ["ame", "자수정"],
      ["sap", "사파이어"],
      ["dia", "다이아몬드"],
    ];
    const AREA: any = {
      mind: ["마음", "ie-tag ie-tag--emotion"],
      rel: ["관계", "ie-tag ie-tag--topic"],
      safe: ["안전", "ie-tag ie-tag--safety"],
      life: ["생활", "ie-tag ie-tag--topic"],
      indep: ["자립", "ie-tag ie-tag--topic"],
    };
    const R: any = this.props.records;
    const doneCount = R.filter((r) => r.st === "done").length;
    const inProgressCount = R.filter((r) => r.st === "doing").length;
    const list = R.filter(
      (r) =>
        (s.view !== "level" || s.lv < 0 || r.lv === s.lv) &&
        (s.view !== "cat" || s.cat === "" || r.area === s.cat) &&
        (s.stt === "" || r.st === s.stt),
    ).sort((a, b) => (s.sort === "new" ? b.d - a.d : a.d - b.d));
    const mk = (a, b) =>
      a === b
        ? ["같아요", "ie-status ie-status--doing"]
        : ["달라졌어요", "ie-status ie-status--done"];
    return {
      gems: LV.map((g, i) => {
        const n = R.filter((r) => r.lv === i && r.st === "done").length;
        return {
          kind: g[0],
          name: g[1],
          level: "LEVEL " + (i + 1),
          soft: n === 0 ? "true" : "false",
          on: s.lv === i,
          badge: i > 1 ? "다음에 열려요" : n ? "했어요 " + n + "개" : "아직 안 했어요",
          badgeCls: n ? "ie-status ie-status--done" : "ie-status ie-status--new",
          pick: () => this.setState({ view: "level", lv: s.lv === i ? -1 : i, open: null }),
        };
      }),
      clearAll: () => this.setState({ view: "all", lv: -1, cat: "", stt: "", open: null }),
      view: s.view,
      views: [
        ["all", "전체"],
        ["state", "진행 상태별"],
        ["level", "단계별"],
        ["cat", "대분류별"],
      ].map((v) => ({ value: v[0], label: v[1] })),
      onView: (e) => this.setState({ view: e.target.value, lv: -1, cat: "", stt: "", open: null }),
      viewTitle:
        s.view === "level"
          ? "단계별로 보기"
          : s.view === "cat"
            ? "대분류별로 보기"
            : s.view === "state"
              ? "진행 상태별로 보기"
              : "전체 기록 보기",
      isLevelView: s.view === "level",
      isCatView: s.view === "cat",
      isStateView: s.view === "state",
      states: [
        ["done", "했어요"],
        ["doing", "하는 중"],
      ].map((x) => ({
        name: x[1],
        count: R.filter((r) => r.st === x[0]).length + "개",
        on: s.stt === x[0],
        pick: () => this.setState({ stt: s.stt === x[0] ? "" : x[0], open: null }),
      })),
      cats: Object.keys(AREA).map((k) => ({
        name: AREA[k][0],
        count: R.filter((r) => r.area === k).length + "개",
        on: s.cat === k,
        pick: () => this.setState({ cat: s.cat === k ? "" : k, open: null }),
      })),
      sort: s.sort,
      sorts: [
        ["new", "최신순"],
        ["old", "오래된 순"],
      ].map((o) => ({ value: o[0], label: o[1] })),
      onSort: (e) => this.setState({ sort: e.target.value }),
      recCount: "기록 " + list.length + "개",
      doneCount,
      inProgressCount,
      noRecords: list.length === 0,
      records: list.map((r) => {
        const open = s.open === r.id;
        return {
          hasMemo: !!r.memo,
          memo: r.memo || "",
          id: r.id,
          date: r.date,
          area: AREA[r.area][0],
          areaCls: AREA[r.area][1],
          title: r.title,
          kind: LV[r.lv][0],
          lvLabel: "LEVEL " + (r.lv + 1) + " · " + LV[r.lv][1],
          isDone: r.st === "done",
          isDoing: r.st === "doing",
          stLabel: r.st === "done" ? "했어요" : "하는 중",
          stCls: r.st === "done" ? "ie-status ie-status--done" : "ie-status ie-status--doing",
          open,
          openLabel: open ? "접기" : "비교 다시 보기",
          toggle: () => this.setState({ open: open ? null : r.id }),
          rows: r.rows.map((x) => {
            const m = mk(x[1], x[2]);
            return { q: x[0], a: x[1], b: x[2], mark: m[0], cls: m[1] };
          }),
        };
      }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="collection" />
        </div>
        <div className="ie-body-row">
          <div className="ie-side-slot">
            <SideNav active="collection" />
          </div>
          <main className="ie-main">
            <section className="ie-banner ie-banner--lav ie-in" aria-labelledby="col-h">
              <span
                className="ie-orb"
                style={{ width: "120px", height: "120px", left: "30%", top: "-44px" }}
              />
              <div className="ie-banner-text" style={{ flex: "1 1 300px", maxWidth: "420px" }}>
                <h1 id="col-h" className="ie-title">
                  내 학습 기록
                </h1>
                <p className="ie-body-lg ie-sub">
                  보석은 점수가 아니라, 내가 경험한 이야기예요. 지난 학습을 골라 그때와 지금의
                  비교를 다시 볼 수 있어요.
                </p>
              </div>
              <div className="ie-shelfwrap">
                <div className="ie-shelf" role="group" aria-label="보석 단계로 골라 보기">
                  {(v.gems || []).map((g: any, __i0: number) => (
                    <Fragment key={__i0}>
                      <button
                        type="button"
                        className="ie-shelfitem"
                        aria-pressed={g.on}
                        onClick={g.pick}
                      >
                        <span className="ie-gemwrap">
                          <Gem kind={g.kind} size="54" soft={g.soft} />
                        </span>
                        <b>{g.name}</b>
                        <span className="ie-meta">{g.badge}</span>
                      </button>
                    </Fragment>
                  ))}
                </div>
                <span className="ie-plank" aria-hidden="true" />
              </div>
            </section>
            <div className="ie-layout">
              <div className="ie-stack">
                <section className="ie-card" aria-labelledby="rec-t">
                  <div className="ie-row-between">
                    <h2 id="rec-t" className="ie-h2">
                      학습 기록
                    </h2>
                    <div className="ie-row" style={{ gap: "10px" }}>
                      <span className="ie-meta" aria-live="polite">
                        {v.recCount}
                      </span>{" "}
                      <label className="ie-sr" htmlFor="sort-sel">
                        정렬
                      </label>{" "}
                      <select
                        id="sort-sel"
                        className="ie-select ie-select-inline"
                        value={v.sort}
                        onChange={v.onSort}
                      >
                        {(v.sorts || []).map((o: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <option value={o.value}>{o.label}</option>
                          </Fragment>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div
                    className="ie-row"
                    style={{ gap: "10px" }}
                    role="group"
                    aria-label="진행 상태로 거르기"
                  >
                    {(v.states || []).map((c: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          className="ie-chip"
                          aria-pressed={c.on}
                          onClick={c.pick}
                        >
                          <span className="ie-box" />
                          {c.name} <span className="ie-meta">{c.count}</span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <ol className="ie-rail">
                    {(v.records || []).map((r: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <li
                          className="ie-card ie-card--flat"
                          style={{ gap: "12px", flexWrap: "wrap" }}
                        >
                          <div
                            className="ie-row"
                            style={{ gap: "14px", flexWrap: "nowrap", alignItems: "flex-start" }}
                          >
                            <Gem kind={r.kind} size="40" />
                            <div
                              className="ie-stack-s"
                              style={{ flex: "1 1 auto", gap: "4px", minWidth: "0" }}
                            >
                              <div className="ie-row">
                                <span className="ie-meta">{r.date}</span>
                                <span className={r.areaCls}>{r.area}</span>
                                <span className="ie-tag">{r.lvLabel}</span>
                                <span className={r.stCls}>{r.stLabel}</span>
                              </div>
                              <b className="ie-body ie-strong" style={{ fontSize: "16px" }}>
                                {r.title}
                              </b>
                            </div>
                          </div>
                          {r.open ? (
                            <div
                              className="ie-card"
                              style={{
                                padding: "16px 18px",
                                gap: "12px",
                                flex: "1 1 100%",
                                width: "100%",
                                minWidth: "0",
                                alignSelf: "stretch",
                              }}
                            >
                              <span className="ie-eyebrow">그때와 지금</span>
                              <div style={{ width: "100%", overflowX: "auto" }}>
                                <table
                                  className="ie-table"
                                  style={{ minWidth: "520px", tableLayout: "fixed" }}
                                >
                                  <colgroup>
                                    <col style={{ width: "34%" }} />
                                    <col style={{ width: "25%" }} />
                                    <col style={{ width: "25%" }} />
                                    <col style={{ width: "16%" }} />
                                  </colgroup>
                                  <thead>
                                    <tr>
                                      <th scope="col">문항</th>
                                      <th scope="col">그때</th>
                                      <th scope="col">지금</th>
                                      <th scope="col">표시</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(r.rows || []).map((x: any, __i1: number) => (
                                      <Fragment key={__i1}>
                                        <tr>
                                          <td>{x.q}</td>
                                          <td>{x.a}</td>
                                          <td>{x.b}</td>
                                          <td>
                                            <span className={x.cls}>{x.mark}</span>
                                          </td>
                                        </tr>
                                      </Fragment>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}{" "}
                          {r.hasMemo ? (
                            <div
                              className="ie-card ie-card--lav"
                              style={{
                                padding: "12px 16px",
                                gap: "4px",
                                flex: "1 1 100%",
                                width: "100%",
                                alignSelf: "stretch",
                              }}
                            >
                              <span className="ie-eyebrow">
                                내가 남긴 한 줄 · 나만 볼 수 있어요
                              </span>
                              <p className="ie-body" style={{ margin: "0" }}>
                                “{r.memo}”
                              </p>
                            </div>
                          ) : null}{" "}
                          {r.isDone ? (
                            <div className="ie-row">
                              <button
                                type="button"
                                className="ie-btn ie-btn--outline ie-btn--sm"
                                aria-expanded={r.open}
                                onClick={r.toggle}
                              >
                                {r.openLabel}
                              </button>{" "}
                              <A className="ie-btn ie-btn--secondary ie-btn--sm" href={ROUTES.unit}>
                                다시 연습하기
                              </A>
                            </div>
                          ) : null}{" "}
                          {r.isDoing ? (
                            <div className="ie-row">
                              <A className="ie-btn ie-btn--primary ie-btn--sm" href={ROUTES.unit}>
                                이어서 하기
                              </A>
                              <span className="ie-meta">
                                끝까지 마치면 그때와 지금 비교가 기록에 남아요.
                              </span>
                            </div>
                          ) : null}
                        </li>
                      </Fragment>
                    ))}
                  </ol>
                  {v.noRecords ? (
                    <div className="ie-empty" role="status">
                      <b className="ie-h3">고른 조건의 기록은 아직 없어요</b>
                      <p className="ie-body ie-sub">언제든 시작할 수 있어요.</p>
                      <button
                        type="button"
                        className="ie-btn ie-btn--secondary"
                        onClick={v.clearAll}
                      >
                        전체 보기
                      </button>
                    </div>
                  ) : null}
                </section>
              </div>
              <aside className="ie-panel" aria-label="기록 안내">
                <section className="ie-card ie-card--lav" style={{ gap: "10px" }}>
                  <b className="ie-body ie-strong">기록은 평가표가 아니에요</b>
                  <p className="ie-body">
                    점수, 순위, 맞고 틀림은 남기지 않아요. 그때와 지금 내가 고른 것을 나란히 볼
                    뿐이에요. 따로 통계 화면도 두지 않아요.
                  </p>
                </section>
                <section className="ie-card ie-card--mint" style={{ gap: "10px" }}>
                  <b className="ie-body ie-strong">지금까지</b>
                  <div className="ie-row">
                    <span className="ie-status ie-status--done">했어요 {v.doneCount}개</span>
                    <span className="ie-status ie-status--doing">하는 중 {v.inProgressCount}개</span>
                  </div>
                </section>
                <section className="ie-card ie-card--flat" style={{ gap: "8px" }}>
                  <b className="ie-body ie-strong">내 기록은 누가 볼 수 있나요?</b>
                  <p className="ie-body">
                    나와, 배정된 이음쌤이에요. 이음쌤은 질문지 응답과 비교 결과를 볼 수 있어요. 내가
                    남긴 한 줄 메모는 이음쌤에게 보이지 않아요.
                  </p>
                  <p className="ie-meta">
                    탈퇴하면 기록을 바로 지우고, 마지막 이용 뒤 1년이 지나도 지워요.
                  </p>
                </section>
                <section className="ie-card ie-card--scene ie-in" aria-label="마을 풍경">
                  <div className="ie-scene-art" style={{ padding: "8px", position: "relative" }}>
                    <img
                      className="ie-3img"
                      src={img.collectionScene}
                      alt=""
                      draggable="false"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        maxHeight: "none",
                        borderRadius: "14px",
                        objectFit: "cover",
                        filter: "none",
                        margin: "0",
                      }}
                    />
                    <p
                      style={{
                        position: "absolute",
                        left: "8px",
                        right: "8px",
                        bottom: "8px",
                        margin: "0",
                        padding: "64px 24px 22px",
                        borderRadius: "0 0 14px 14px",
                        background:
                          "linear-gradient(180deg,rgba(54,44,104,0) 0,rgba(54,44,104,.58) 100%)",
                        fontFamily: "'Noto Serif KR','Nanum Myeongjo','Batang',serif",
                        fontWeight: "500",
                        fontSize: "clamp(18px,1.9vw,26px)",
                        lineHeight: "1.4",
                        letterSpacing: ".02em",
                        color: "#fff",
                        textShadow: "0 1px 8px rgba(40,30,90,.5)",
                      }}
                    >
                      보석은 내가 걸어온 이야기예요.
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </main>
        </div>
      </div>
    );
  }
}
