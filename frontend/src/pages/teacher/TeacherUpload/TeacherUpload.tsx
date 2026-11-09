/**
 * T04 강의 자료 올리기
 * (원본 디자인: TeacherUpload.dc.html)
 */
import { Component, Fragment } from "react";
import { teacherService } from "@/api";
import { A } from "@/lib/A";
import { css } from "@/lib/css";
import { img } from "@/assets";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";
import TeacherNav from "@/components/TeacherNav/TeacherNav";
import Gem from "@/components/Gem/Gem";
import PageStyle from "@/lib/PageStyle";
import pageCss from "./TeacherUpload.css?inline";

export default class TeacherUpload extends Component<any, any> {
  [key: string]: any;

  constructor(props) {
    super(props);
    this.state = {
      area: "safe",
      level: 0,
      tab: "card",
      drag: false,
      msg: "",
      hint: "",
      seq: 20,
      checks: [false, false, false],
      cards: [],
      videos: [],
    };
  }
  upd(key, id, patch) {
    this.setState({
      [key]: this.state[key].map((x) => (x.id === id ? Object.assign({}, x, patch) : x)),
      msg: "",
      hint: "",
    });
  }
  move(key, id, d) {
    const list = this.state[key].slice();
    const a = list.findIndex((x) => x.id === id);
    const b = a + d;
    if (a < 0 || b < 0 || b >= list.length) return;
    const t = list[a];
    list[a] = list[b];
    list[b] = t;
    this.setState({ [key]: list, msg: "", hint: "" });
  }
  addFiles(files) {
    const s = this.state;
    const isCard = s.tab === "card";
    const key = isCard ? "cards" : "videos";
    const list = s[key].slice();
    let seq = s.seq;
    Array.from((files || []) as any[]).forEach((f) => {
      const mb = f.size / 1048576;
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      const okExt = isCard ? ["png", "jpg", "jpeg", "pdf"].indexOf(ext) >= 0 : ext === "mp4";
      const max = isCard ? 10 : 500;
      let status = "selected";
      let err = "";
      if (!okExt) {
        status = "err";
        err = isCard ? "JPG, PNG, PDF 파일만 올릴 수 있어요." : "MP4 파일만 올릴 수 있어요.";
      } else if (mb > max) {
        status = "err";
        err = "파일이 너무 커요. " + max + "MB 안으로 줄여서 다시 올려 주세요.";
      }
      list.push({
        id: seq++,
        title: f.name.replace(/\.[^.]+$/, ""),
        text: "",
        file: f.name,
        size: mb.toFixed(1) + "MB",
        dur: "",
        status,
        err,
        pct: 100,
        img: -1,
        sub: false,
      });
    });
    this.setState({ [key]: list, seq, drag: false, msg: "", hint: "" });
  }
  renderVals() {
    const s = this.state;
    const AREAS: any = [
      ["safe", "안전", "안전·자기 보호"],
      ["rel", "관계", "관계"],
      ["mind", "마음", "마음"],
      ["life", "생활", "생활"],
      ["indep", "자립", "자립"],
    ];
    const LEVELS: any = [
      ["opal", "오팔"],
      ["aqua", "아쿠아마린"],
      ["ame", "자수정"],
      ["sap", "사파이어"],
      ["dia", "다이아몬드"],
    ];
    const isCard = s.tab === "card";
    const key = isCard ? "cards" : "videos";
    const items = s[key];
    const areaName = AREAS.filter((a) => a[0] === s.area)[0][2];
    const levelName = LEVELS[s.level][1] + " · LEVEL " + (s.level + 1);
    const ST: any = {
      done: ["올렸어요", "ie-status ie-status--done"],
      selected: ["올리기 전", "ie-status ie-status--new"],
      up: ["올리는 중", "ie-status ie-status--doing"],
      err: ["올리지 못했어요", "ie-status ie-status--wait"],
    };
    const mk = (x, k, n) => ({
      id: x.id,
      n: n + 1,
      title: x.title,
      text: x.text,
      file: x.file,
      size: x.size,
      dur: x.dur,
      hasDur: x.dur !== "",
      stLabel: x.status === "up" ? "올리는 중 " + x.pct + "%" : ST[x.status][0],
      stCls: ST[x.status][1],
      isUp: x.status === "up",
      isErr: x.status === "err",
      err: x.err,
      hasFields: x.status !== "err",
      pct: x.pct,
      pctW: x.pct + "%",
      img0: x.img === 0,
      img1: x.img === 1,
      img2: x.img === 2,
      noImg: x.img < 0,
      sub: x.sub,
      subLabel: x.sub ? "자막 있어요" : "자막 없어요",
      subCls: x.sub ? "ie-status ie-status--done" : "ie-status ie-status--new",
      subBtn: x.sub ? "자막 지우기" : "자막 올리기",
      toggleSub: () => this.upd("videos", x.id, { sub: !x.sub }),
      onTitle: (e) => this.upd(k, x.id, { title: e.target.value }),
      onText: (e) => this.upd(k, x.id, { text: e.target.value }),
      upOff: n === 0,
      downOff: n === s[k].length - 1,
      up: () => this.move(k, x.id, -1),
      down: () => this.move(k, x.id, 1),
      remove: () => this.setState({ [k]: s[k].filter((y) => y.id !== x.id), msg: "", hint: "" }),
    });
    const CHECKS = [
      "학습자의 얼굴, 이름, 학교, 연락처가 보이지 않아요.",
      "놀라거나 불편할 수 있는 장면은 그림이나 말로 바꿨어요.",
      "사진에는 글 설명을, 영상에는 자막을 붙였어요.",
    ];
    const problems: any[] = [];
    if (items.length === 0) problems.push("올릴 자료를 먼저 골라 주세요.");
    if (items.some((x) => x.status === "up"))
      problems.push("올리는 중인 자료가 있어요. 끝날 때까지 기다려 주세요.");
    if (items.some((x) => x.status === "err"))
      problems.push("올리지 못한 자료가 있어요. 다시 올리거나 지워 주세요.");
    if (items.some((x) => x.status === "selected" && x.title.trim() === ""))
      problems.push("제목이 비어 있는 자료가 있어요.");
    if (!s.checks.every(Boolean)) problems.push("확인 항목을 모두 눌러 주세요.");
    const first = items.find((x) => x.status === "selected" || x.status === "done") || null;
    const needLevelTab = s.level === 0 ? "card" : "video";
    const mismatch = s.tab !== needLevelTab;
    const cnt = isCard ? "카드 " + items.length + "장" : "영상 " + items.length + "편";
    const upN = items.filter((x) => x.status === "up").length;
    return {
      areaChips: AREAS.map((a) => ({
        label: a[1],
        on: s.area === a[0],
        pick: () => this.setState({ area: a[0], msg: "", hint: "" }),
      })),
      levelChips: LEVELS.map((l, k) => ({
        label: l[1] + " · LEVEL " + (k + 1),
        on: s.level === k,
        pick: () => this.setState({ level: k, tab: k === 0 ? "card" : "video", msg: "", hint: "" }),
      })),
      gemKind: LEVELS[s.level][0],
      areaName,
      levelName,
      tabs: [
        ["card", "카드 (사진·파일) " + s.cards.length],
        ["video", "동영상 " + s.videos.length],
      ].map((t) => ({
        label: t[1],
        on: s.tab === t[0],
        pick: () => this.setState({ tab: t[0], msg: "", hint: "" }),
      })),
      countText: cnt + (upN > 0 ? " · 올리는 중 " + upN + "개" : ""),
      typeNote:
        s.level === 0
          ? "오팔 단계는 학습 카드로 배워요. 사진이나 파일을 올리면 카드가 돼요."
          : "아쿠아마린부터는 영상으로 배워요. 학습자는 영상을 끝까지 봐야 다음으로 갈 수 있어요.",
      mismatch,
      mismatchText:
        s.level === 0
          ? "오팔 단계는 카드로 배워요. 지금 올리는 영상은 이 단계 학습에 쓰이지 않아요."
          : LEVELS[s.level][1] +
            " 단계는 영상으로 배워요. 지금 올리는 카드는 이 단계 학습에 쓰이지 않아요.",
      panelLabel: isCard ? "카드 올리기" : "동영상 올리기",
      isCardTab: isCard,
      isVideoTab: !isCard,
      accept: isCard
        ? "image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf"
        : "video/mp4,.mp4",
      dropTitle: isCard
        ? "사진이나 파일을 끌어 놓거나 눌러서 골라요"
        : "영상 파일을 끌어 놓거나 눌러서 골라요",
      dropMeta: isCard
        ? "JPG, PNG, PDF · 한 장에 10MB까지 · 여러 장을 한꺼번에 고를 수 있어요"
        : "MP4 · 한 편에 500MB까지 · 영상 한 편이 학습 한 칸이 돼요",
      dropBorder: s.drag ? "#5366AF" : "#C5CCDC",
      dropBg: s.drag ? "#EEF1FB" : "#FAFBFF",
      onDragOver: (e) => {
        e.preventDefault();
        if (!s.drag) this.setState({ drag: true });
      },
      onDragLeave: () => this.setState({ drag: false }),
      onDrop: (e) => {
        e.preventDefault();
        this.addFiles(e.dataTransfer ? e.dataTransfer.files : []);
      },
      onFiles: (e) => this.addFiles(e.target.files),
      cardItems: s.cards.map((x, n) => mk(x, "cards", n)),
      noCards: s.cards.length === 0,
      videoItems: s.videos.map((x, n) => mk(x, "videos", n)),
      noVideos: s.videos.length === 0,
      checks: CHECKS.map((t, k) => ({
        label: t,
        on: s.checks[k],
        pick: () =>
          this.setState({ checks: s.checks.map((c, j) => (j === k ? !c : c)), msg: "", hint: "" }),
      })),
      publishOff: problems.length > 0,
      publish: async () => {
        if (problems.length > 0) {
          this.setState({ hint: problems.join(" "), msg: "" });
          return;
        }
        this.setState({ hint: "", msg: "" });
        try {
          await teacherService.publishMaterials({ tab: s.tab, area: s.area, level: s.level, items });
          this.setState({ msg: "published" });
        } catch (error) {
          this.setState({
            hint: error instanceof Error ? error.message : "자료를 게시하지 못했어요.",
          });
        }
      },
      saveDraft: () =>
        this.setState({
          msg: "",
          hint: "임시 저장 기능이 아직 연결되지 않아 자료가 저장되지 않았어요.",
        }),
      showHint: s.hint !== "",
      hint: s.hint,
      isPublished: s.msg === "published",
      pvEyebrow: isCard ? "학습 카드 1 / " + items.length : "영상 1 / " + items.length,
      pvTitle: first && first.title.trim() !== "" ? first.title : "제목을 적으면 여기에 보여요",
      pvMeta: first
        ? isCard
          ? first.text.trim() !== ""
            ? first.text
            : "카드 설명이 아직 없어요"
          : first.text.trim() !== ""
            ? first.text
            : "영상 소개가 아직 없어요"
        : "올린 자료가 아직 없어요",
      mine: [],
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <>
        <PageStyle css={pageCss} />
        <div className="ie-root ie-shell">
          <div className="ie-header-slot">
            <Header active="tupl" role="teacher" />
          </div>
          <div className="ie-body-row">
            <div className="ie-side-slot">
              <TeacherNav active="tupl" />
            </div>
            <main className="ie-main">
              <section className="ie-banner ie-banner--sky ie-in" aria-labelledby="tu-h">
                <span
                  className="ie-orb"
                  style={{ width: "120px", height: "120px", left: "42%", top: "-44px" }}
                />
                <div className="ie-banner-text" style={{ maxWidth: "600px" }}>
                  <nav className="ie-crumb" aria-label="현재 위치">
                    <A href={ROUTES.teacher}>이음쌤 홈</A>
                    <span aria-hidden="true">›</span>
                    <span>강의 자료 올리기</span>
                  </nav>
                  <h1 id="tu-h" className="ie-title">
                    강의 자료 올리기
                  </h1>
                  <p className="ie-body-lg ie-sub">
                    학습 카드(사진·파일)와 영상을 올려요. 올린 자료는 고른 영역과 단계의 학습에
                    들어가요.
                  </p>
                </div>
              </section>
              <div className="ie-layout">
                <div className="ie-stack">
                  <section className="ie-card" aria-labelledby="tu-s1" style={{ gap: "18px" }}>
                    <h2 id="tu-s1" className="ie-h2">
                      1. 어디에 들어갈 자료예요?
                    </h2>
                    <div
                      className="ie-stack-s"
                      style={{ gap: "8px" }}
                      role="radiogroup"
                      aria-labelledby="tu-area-l"
                    >
                      <span id="tu-area-l" className="ie-label">
                        학습 영역
                      </span>
                      <div className="ie-row" style={{ gap: "10px" }}>
                        {(v.areaChips || []).map((c: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <button
                              type="button"
                              role="radio"
                              className="ie-chip"
                              aria-checked={c.on}
                              onClick={c.pick}
                            >
                              <span className="ie-chip-check">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              {c.label}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div
                      className="ie-stack-s"
                      style={{ gap: "8px" }}
                      role="radiogroup"
                      aria-labelledby="tu-lv-l"
                    >
                      <span id="tu-lv-l" className="ie-label">
                        단계
                      </span>
                      <div className="ie-row" style={{ gap: "10px" }}>
                        {(v.levelChips || []).map((c: any, __i0: number) => (
                          <Fragment key={__i0}>
                            <button
                              type="button"
                              role="radio"
                              className="ie-chip"
                              aria-checked={c.on}
                              onClick={c.pick}
                            >
                              <span className="ie-chip-check">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 256 256"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                              {c.label}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                      <span className="ie-help">
                        오팔은 학습 카드로, 아쿠아마린부터는 영상으로 배워요. 단계를 고르면 맞는
                        종류가 먼저 열려요.
                      </span>
                    </div>
                    <div
                      className="ie-card ie-card--flat"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 16px",
                      }}
                    >
                      <Gem kind={v.gemKind} size="40" />
                      <div className="ie-stack-s" style={{ gap: "0" }}>
                        <span className="ie-meta">올릴 곳</span>
                        <b className="ie-body-lg ie-strong">
                          {v.areaName}
                          {" · "}
                          {v.levelName}
                        </b>
                      </div>
                    </div>
                  </section>
                  <section className="ie-card" aria-labelledby="tu-s2" style={{ gap: "18px" }}>
                    <div className="ie-row-between">
                      <h2 id="tu-s2" className="ie-h2">
                        2. 자료 올리기
                      </h2>
                      <span className="ie-meta" aria-live="polite">
                        {v.countText}
                      </span>
                    </div>
                    <div className="ie-seg" role="tablist" aria-label="자료 종류">
                      {(v.tabs || []).map((t: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <button type="button" role="tab" aria-selected={t.on} onClick={t.pick}>
                            {t.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    <div className="ie-alert ie-alert--info" role="note">
                      <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#BFDDFF" />
                        <path
                          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                          fill="#2B5C96"
                        />
                      </svg>
                      <div>{v.typeNote}</div>
                    </div>
                    {v.mismatch ? (
                      <div className="ie-alert ie-alert--warm" role="status">
                        <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                          <path
                            d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                            fill="#FFD6C1"
                          />
                          <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                            fill="#94431F"
                          />
                        </svg>
                        <div>{v.mismatchText}</div>
                      </div>
                    ) : null}
                    <div
                      role="tabpanel"
                      aria-label={v.panelLabel}
                      className="ie-stack"
                      style={{ gap: "16px" }}
                    >
                      <label
                        className="tu-drop"
                        onDragOver={v.onDragOver}
                        onDragLeave={v.onDragLeave}
                        onDrop={v.onDrop}
                        style={css(
                          `position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px 20px;border-radius:20px;border:2px dashed ${v.dropBorder};background:${v.dropBg};text-align:center;cursor:pointer`,
                        )}
                      >
                        <input
                          type="file"
                          className="ie-sr"
                          multiple
                          accept={v.accept}
                          onChange={v.onFiles}
                        />{" "}
                        <span className="ie-tile ie-tile--sky" aria-hidden="true">
                          <svg width="26" height="26" viewBox="0 0 256 256">
                            <path
                              d="M40,152H216v56a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8Z"
                              fill="#BFDDFF"
                            />
                            <path
                              d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V152a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"
                              fill="#3F4F94"
                            />
                          </svg>
                        </span>{" "}
                        <b className="ie-body-lg ie-strong">{v.dropTitle}</b>{" "}
                        <span className="ie-meta">{v.dropMeta}</span>{" "}
                        <span className="ie-btn ie-btn--secondary">파일 고르기</span>
                      </label>{" "}
                      {v.isCardTab ? (
                        <>
                          {v.noCards ? (
                            <div className="ie-empty" role="status">
                              <b className="ie-h3">아직 올린 카드가 없어요</b>
                              <p className="ie-body ie-sub">
                                위에서 사진이나 파일을 고르면 카드가 만들어져요.
                              </p>
                            </div>
                          ) : null}
                          <ol className="ie-stack-s" style={{ gap: "12px" }} aria-label="올린 카드">
                            {(v.cardItems || []).map((c: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <li
                                  className="ie-card ie-card--flat"
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    alignItems: "flex-start",
                                    gap: "16px",
                                  }}
                                >
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "8px", flex: "0 0 128px" }}
                                  >
                                    <div
                                      className="ie-media ie-media--img"
                                      style={{
                                        aspectRatio: "4 / 3",
                                        borderRadius: "14px",
                                        padding: "6px 0",
                                      }}
                                      aria-hidden="true"
                                    >
                                      {c.img0 ? (
                                        <img
                                          className="ie-uimg"
                                          src={img.unitCard1}
                                          alt=""
                                          draggable="false"
                                        />
                                      ) : null}
                                      {c.img1 ? (
                                        <img
                                          className="ie-uimg"
                                          src={img.unitCard2}
                                          alt=""
                                          draggable="false"
                                        />
                                      ) : null}
                                      {c.img2 ? (
                                        <img
                                          className="ie-uimg"
                                          src={img.unitCard3}
                                          alt=""
                                          draggable="false"
                                        />
                                      ) : null}{" "}
                                      {c.noImg ? (
                                        <span>
                                          <svg width="40" height="40" viewBox="0 0 256 256">
                                            <rect
                                              x="32"
                                              y="48"
                                              width="192"
                                              height="160"
                                              rx="18"
                                              fill="#DCE3F5"
                                            />
                                            <circle cx="96" cy="104" r="16" fill="#8E98B2" />
                                            <path
                                              d="M44 196l58-58 40 40 30-30 40 48z"
                                              fill="#8E98B2"
                                            />
                                          </svg>
                                        </span>
                                      ) : null}
                                    </div>
                                    <span className="ie-meta">
                                      {c.file}
                                      {" · "}
                                      {c.size}
                                    </span>
                                  </div>
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "12px", flex: "1 1 280px", minWidth: "0" }}
                                  >
                                    <div className="ie-row-between">
                                      <b className="ie-body ie-strong">
                                        {"카드 "}
                                        {c.n}
                                      </b>
                                      <span className={c.stCls}>{c.stLabel}</span>
                                    </div>
                                    {c.isUp ? (
                                      <div
                                        className="ie-bar"
                                        role="progressbar"
                                        aria-label={`카드 ${c.n} 올리는 중`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={c.pct}
                                      >
                                        <span style={css(`width:${c.pctW}`)} />
                                      </div>
                                    ) : null}{" "}
                                    {c.isErr ? (
                                      <div className="ie-alert ie-alert--error" role="alert">
                                        <div>{c.err}</div>
                                      </div>
                                    ) : null}{" "}
                                    {c.hasFields ? (
                                      <>
                                        <div className="ie-field">
                                          <label className="ie-label" htmlFor={`ct-${c.id}`}>
                                            카드 제목
                                          </label>
                                          <input
                                            id={`ct-${c.id}`}
                                            className="ie-input"
                                            type="text"
                                            maxLength={40}
                                            value={c.title}
                                            onChange={c.onTitle}
                                          />
                                        </div>
                                        <div className="ie-field">
                                          <label className="ie-label" htmlFor={`cx-${c.id}`}>
                                            {"카드 설명 "}
                                            <span className="ie-opt">두 줄 안팎</span>
                                          </label>
                                          <textarea
                                            id={`cx-${c.id}`}
                                            className="ie-textarea"
                                            maxLength={120}
                                            style={{ minHeight: "84px" }}
                                            value={c.text}
                                            onChange={c.onText}
                                          />
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                  <div className="ie-row" style={{ gap: "6px" }}>
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`카드 ${c.n} 앞으로 옮기기`}
                                      disabled={c.upOff}
                                      onClick={c.up}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M128 208V56M64 120l64-64 64 64"
                                          fill="none"
                                          stroke="#28334C"
                                          strokeWidth="20"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>{" "}
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`카드 ${c.n} 뒤로 옮기기`}
                                      disabled={c.downOff}
                                      onClick={c.down}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M128 48V200M64 136l64 64 64-64"
                                          fill="none"
                                          stroke="#28334C"
                                          strokeWidth="20"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>{" "}
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`카드 ${c.n} 지우기`}
                                      onClick={c.remove}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M48 68H208M104 36H152M76 68L88 212H168L180 68"
                                          fill="none"
                                          stroke="#A3401E"
                                          strokeWidth="18"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </li>
                              </Fragment>
                            ))}
                          </ol>
                        </>
                      ) : null}{" "}
                      {v.isVideoTab ? (
                        <>
                          {v.noVideos ? (
                            <div className="ie-empty" role="status">
                              <b className="ie-h3">아직 올린 영상이 없어요</b>
                              <p className="ie-body ie-sub">
                                위에서 MP4 파일을 고르면 영상이 목록에 들어와요.
                              </p>
                            </div>
                          ) : null}
                          <ol className="ie-stack-s" style={{ gap: "12px" }} aria-label="올린 영상">
                            {(v.videoItems || []).map((c: any, __i0: number) => (
                              <Fragment key={__i0}>
                                <li
                                  className="ie-card ie-card--flat"
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    alignItems: "flex-start",
                                    gap: "16px",
                                  }}
                                >
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "8px", flex: "0 0 168px" }}
                                  >
                                    <div
                                      className="ie-media"
                                      style={{ aspectRatio: "16 / 9", borderRadius: "14px" }}
                                      aria-hidden="true"
                                    >
                                      <span
                                        style={{
                                          position: "absolute",
                                          left: "50%",
                                          top: "50%",
                                          transform: "translate(-50%,-50%)",
                                          width: "48px",
                                          height: "48px",
                                          borderRadius: "50%",
                                          background: "#FFFFFF",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          boxShadow: "var(--ie-shadow-1)",
                                        }}
                                      >
                                        <svg width="22" height="22" viewBox="0 0 256 256">
                                          <path
                                            d="M90,56 L206,128 L90,200 Z"
                                            fill="#5366AF"
                                            stroke="#5366AF"
                                            strokeWidth="20"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </span>{" "}
                                      {c.hasDur ? (
                                        <span
                                          className="ie-tag"
                                          style={{
                                            position: "absolute",
                                            right: "8px",
                                            bottom: "8px",
                                            background: "#FFFFFF",
                                          }}
                                        >
                                          {c.dur}
                                        </span>
                                      ) : null}
                                    </div>
                                    <span className="ie-meta">
                                      {c.file}
                                      {" · "}
                                      {c.size}
                                    </span>
                                  </div>
                                  <div
                                    className="ie-stack-s"
                                    style={{ gap: "12px", flex: "1 1 280px", minWidth: "0" }}
                                  >
                                    <div className="ie-row-between">
                                      <b className="ie-body ie-strong">
                                        {"영상 "}
                                        {c.n}
                                      </b>
                                      <span className={c.stCls}>{c.stLabel}</span>
                                    </div>
                                    {c.isUp ? (
                                      <div
                                        className="ie-bar"
                                        role="progressbar"
                                        aria-label={`영상 ${c.n} 올리는 중`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={c.pct}
                                      >
                                        <span style={css(`width:${c.pctW}`)} />
                                      </div>
                                    ) : null}{" "}
                                    {c.isErr ? (
                                      <div className="ie-alert ie-alert--error" role="alert">
                                        <div>{c.err}</div>
                                      </div>
                                    ) : null}{" "}
                                    {c.hasFields ? (
                                      <>
                                        <div className="ie-field">
                                          <label className="ie-label" htmlFor={`vt-${c.id}`}>
                                            영상 제목
                                          </label>
                                          <input
                                            id={`vt-${c.id}`}
                                            className="ie-input"
                                            type="text"
                                            maxLength={40}
                                            value={c.title}
                                            onChange={c.onTitle}
                                          />
                                        </div>
                                        <div className="ie-field">
                                          <label className="ie-label" htmlFor={`vx-${c.id}`}>
                                            {"영상 소개 "}
                                            <span className="ie-opt">보기 전에 한두 문장</span>
                                          </label>
                                          <textarea
                                            id={`vx-${c.id}`}
                                            className="ie-textarea"
                                            maxLength={120}
                                            style={{ minHeight: "84px" }}
                                            value={c.text}
                                            onChange={c.onText}
                                          />
                                        </div>
                                        <div className="ie-row" style={{ gap: "10px" }}>
                                          <span className="ie-label">
                                            {"자막 파일 "}
                                            <span className="ie-opt">선택</span>
                                          </span>
                                          <span className={c.subCls}>{c.subLabel}</span>
                                          <button
                                            type="button"
                                            className="ie-btn ie-btn--outline ie-btn--sm"
                                            onClick={c.toggleSub}
                                          >
                                            {c.subBtn}
                                          </button>
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                  <div className="ie-row" style={{ gap: "6px" }}>
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`영상 ${c.n} 앞으로 옮기기`}
                                      disabled={c.upOff}
                                      onClick={c.up}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M128 208V56M64 120l64-64 64 64"
                                          fill="none"
                                          stroke="#28334C"
                                          strokeWidth="20"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>{" "}
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`영상 ${c.n} 뒤로 옮기기`}
                                      disabled={c.downOff}
                                      onClick={c.down}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M128 48V200M64 136l64 64 64-64"
                                          fill="none"
                                          stroke="#28334C"
                                          strokeWidth="20"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>{" "}
                                    <button
                                      type="button"
                                      className="ie-iconbtn"
                                      aria-label={`영상 ${c.n} 지우기`}
                                      onClick={c.remove}
                                    >
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 256 256"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M48 68H208M104 36H152M76 68L88 212H168L180 68"
                                          fill="none"
                                          stroke="#A3401E"
                                          strokeWidth="18"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </li>
                              </Fragment>
                            ))}
                          </ol>
                        </>
                      ) : null}
                    </div>
                  </section>
                  <section className="ie-card" aria-labelledby="tu-s3" style={{ gap: "16px" }}>
                    <h2 id="tu-s3" className="ie-h2">
                      3. 올리기 전에 확인해요
                    </h2>
                    <div
                      className="ie-stack-s"
                      style={{ gap: "10px" }}
                      role="group"
                      aria-label="확인 항목"
                    >
                      {(v.checks || []).map((k: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <button
                            type="button"
                            className="ie-chip"
                            aria-pressed={k.on}
                            onClick={k.pick}
                            style={{
                              width: "100%",
                              justifyContent: "flex-start",
                              borderRadius: "14px",
                            }}
                          >
                            <span className="ie-box" />
                            {k.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    {v.showHint ? (
                      <div className="ie-alert ie-alert--warm" role="alert">
                        <div>{v.hint}</div>
                      </div>
                    ) : null}{" "}
                    {v.isPublished ? (
                      <div className="ie-alert ie-alert--ok" role="status">
                        <div>
                          <b>자료를 올렸어요.</b> {v.areaName}
                          {" · "}
                          {v.levelName}
                          {" 학습에서 볼 수 있어요."}
                        </div>
                      </div>
                    ) : null}
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--primary ie-btn--lg"
                        aria-disabled={v.publishOff}
                        onClick={v.publish}
                      >
                        학습자에게 올리기
                      </button>
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline ie-btn--lg"
                        onClick={v.saveDraft}
                      >
                        임시 저장
                      </button>
                      <A className="ie-btn ie-btn--text" href={ROUTES.teacher}>
                        나가기
                      </A>
                    </div>
                  </section>
                </div>
                <aside className="ie-panel" aria-label="올리기 안내">
                  <section className="ie-card" aria-labelledby="tu-pv" style={{ gap: "12px" }}>
                    <h2 id="tu-pv" className="ie-h3">
                      학습자에게는 이렇게 보여요
                    </h2>
                    <div className="ie-media" style={{ aspectRatio: "16 / 9" }} aria-hidden="true">
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%,-50%)",
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "var(--ie-shadow-1)",
                        }}
                      >
                        {v.isVideoTab ? (
                          <svg width="26" height="26" viewBox="0 0 256 256">
                            <path
                              d="M90,56 L206,128 L90,200 Z"
                              fill="#5366AF"
                              stroke="#5366AF"
                              strokeWidth="20"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}{" "}
                        {v.isCardTab ? (
                          <svg width="26" height="26" viewBox="0 0 256 256">
                            <rect x="32" y="48" width="192" height="160" rx="18" fill="#DCE3F5" />
                            <circle cx="96" cy="104" r="16" fill="#5366AF" />
                            <path d="M44 196l58-58 40 40 30-30 40 48z" fill="#5366AF" />
                          </svg>
                        ) : null}
                      </span>
                    </div>
                    <div
                      className="ie-learnpanel"
                      style={{ padding: "14px 18px 16px 22px", gap: "6px" }}
                    >
                      <span className="ie-eyebrow">{v.pvEyebrow}</span>
                      <b className="ie-body-lg ie-strong">{v.pvTitle}</b>
                      <span className="ie-meta">{v.pvMeta}</span>
                    </div>
                  </section>
                  <section className="ie-card ie-card--mint">
                    <h2 className="ie-h3">올릴 수 있는 파일</h2>
                    <ul
                      className="ie-stack-s"
                      style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                    >
                      <li className="ie-body">카드: JPG, PNG, PDF · 한 장에 10MB까지</li>
                      <li className="ie-body">영상: MP4 · 한 편에 500MB까지</li>
                      <li className="ie-body">자막: 영상마다 파일 하나, 없어도 올릴 수 있어요</li>
                    </ul>
                  </section>
                  <section className="ie-card ie-card--peach">
                    <h2 className="ie-h3">이런 자료는 조심해요</h2>
                    <ul
                      className="ie-stack-s"
                      style={{ gap: "6px", listStyle: "disc", paddingLeft: "18px" }}
                    >
                      <li className="ie-body">실제 학습자의 얼굴이나 이야기가 드러나는 자료</li>
                      <li className="ie-body">따라 하고 싶어질 만큼 자세하거나 자극적인 장면</li>
                      <li className="ie-body">점수나 순위로 줄 세우는 내용</li>
                    </ul>
                  </section>
                  <section className="ie-card" aria-labelledby="tu-my" style={{ gap: "12px" }}>
                    <h2 id="tu-my" className="ie-h3">
                      내가 올린 자료
                    </h2>
                    <ul className="ie-stack-s" style={{ gap: "10px" }}>
                      {(v.mine || []).map((m: any, __i0: number) => (
                        <Fragment key={__i0}>
                          <li
                            className="ie-card ie-card--flat"
                            style={{ padding: "12px 14px", gap: "6px" }}
                          >
                            <b className="ie-body ie-strong">{m.name}</b>
                            <span className="ie-meta">{m.meta}</span>
                            <span className={m.cls} style={{ alignSelf: "flex-start" }}>
                              {m.status}
                            </span>
                          </li>
                        </Fragment>
                      ))}
                    </ul>
                  </section>
                </aside>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }
}
