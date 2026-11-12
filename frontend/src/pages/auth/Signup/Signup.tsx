/**
 * S03 회원 가입
 * (원본 디자인: Signup.dc.html)
 */
import { Component, Fragment } from "react";
import { authService } from "@/api";
import { A } from "@/lib/A";
import type { CSSProperties } from "react";
import { ROUTES } from "@/routes";
import Header from "@/components/Header/Header";

export default class Signup extends Component<any, any> {
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
        if (ev.key === "ieum-reset-signup") {
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
      phase: "type",
      type: "",
      agree: [false, false],
      tryType: false,
      name: "",
      uid: "",
      nick: "",
      pw: "",
      pwConfirm: "",
      email: "",
      org: "",
      birth: "",
      phone: "",
      tried: false,
      ans: {},
      gName: "",
      gRel: "",
      gContact: "",
      gAgree: false,
      gTried: false,
      gUnsent: false,
      submitErr: "",
      submitting: false,
    };
  }
  buildSignup(s, guardian?) {
    const REL = { "부모": "PARENT", "조부모·친척": "RELATIVE", "시설 보호자": "FACILITY" };
    const teacher = s.type === "tch";
    const req: any = {
      role: teacher ? "TEACHER" : "STUDENT",
      loginId: s.uid.trim(),
      password: s.pw,
      name: s.name.trim(),
      nickname: s.nick.trim(),
      birthDate: s.birth,
      phone: s.phone.replace(/[^0-9]/g, ""),
      email: s.email.trim(),
      school: s.org.trim() || undefined,
      agreeTerms: !!s.agree[0],
      agreePrivacy: !!s.agree[1],
    };
    if (guardian) {
      req.guardian = {
        name: guardian.name.trim(),
        relation: REL[guardian.relation] || "OTHER",
        contact: guardian.contact.trim(),
      };
    }
    return req;
  }
  renderVals() {
    const s = this.state;
    const T: any = [
      {
        k: "u14",
        name: "14세 미만 학생",
        desc: "만 14세 미만이에요. 보호자(법정대리인)의 동의가 필요해요.",
        tile: "ie-tile--lav",
        icon: "U1",
      },
      {
        k: "o14",
        name: "14세 이상 학생",
        desc: "만 14세 이상이에요. 상황을 연습하고 내 마음을 돌아봐요.",
        tile: "ie-tile--sky",
        icon: "U2",
      },
      {
        k: "tch",
        name: "이음쌤",
        desc: "학습자의 쪽지를 읽고 답하는 담당자예요.",
        tile: "ie-tile--mint",
        icon: "U3",
      },
    ];
    const TERMS: any = [
      ["이음 이용 약관 동의", `${ROUTES.terms}#terms`],
      ["개인정보 수집 및 이용 동의", `${ROUTES.terms}#privacy`],
    ];
    const teacher = s.type === "tch";
    const bd = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s.birth)
      ? new Date(s.birth + "T00:00:00")
      : null;
    const now = new Date();
    const birthFuture = bd !== null && bd > now;
    let age = -1;
    if (bd !== null && !birthFuture) {
      age = now.getFullYear() - bd.getFullYear();
      if (
        now.getMonth() < bd.getMonth() ||
        (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())
      )
        age -= 1;
    }
    const mismatch = !teacher && age >= 0 && (s.type === "u14") !== age < 14;
    const birthOk = teacher
      ? bd !== null && !birthFuture
      : bd !== null && !birthFuture && !mismatch;
    const birthMsg =
      bd === null
        ? "생년월일을 골라 주세요."
        : birthFuture
          ? "오늘보다 뒤의 날짜예요. 다시 골라 주세요."
          : "고른 가입 유형과 생년월일이 맞지 않아요. 처음으로 돌아가 유형을 다시 고르거나 생년월일을 확인해 주세요.";
    const under14 = s.type === "u14";
    const inv = {
      name: s.name.trim() === "",
      uid: !/^[A-Za-z0-9]{4,20}$/.test(s.uid.trim()),
      nick: s.nick.trim() === "",
      pw: s.pw.length < 8,
      pwConfirm: s.pwConfirm === "" || s.pwConfirm !== s.pw,
      birth: !birthOk,
      phone: !/^0[0-9]{9,10}$/.test(s.phone.replace(/[^0-9]/g, "")),
      mail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim()),
    };
    const anyInv = Object.values(inv).some(Boolean);
    const bad: any = {};
    Object.keys(inv).forEach((k) => {
      bad[k] = s.tried && inv[k];
    });
    const cls = (b) => (b ? "ie-input is-error" : "ie-input");
    const Q: any = [
      { k: "q1", text: "요즘 잠을 편하게 잤어요." },
      { k: "q2", text: "요즘 마음 편히 이야기할 사람이 있어요." },
      { k: "q3", text: "요즘 마음이 무겁게 느껴지는 때가 있어요." },
    ];
    const F: any = [
      ["전혀 아니에요", "M10.5 23 Q16 18 21.5 23", "#FFD6C1"],
      ["아니에요", "M11 22.5 Q16 19.8 21 22.5", "#FFE3CF"],
      ["보통이에요", "M11 21.5 L21 21.5", "#FFF0C9"],
      ["그래요", "M11 20.5 Q16 23.5 21 20.5", "#D9F0E3"],
      ["매우 그래요", "M10 19.5 Q16 26 22 19.5", "#BFE8D5"],
    ];
    const cur =
      s.phase === "type"
        ? 0
        : s.phase === "form" || s.phase === "guardian" || s.phase === "wait"
          ? 1
          : 2;
    const SL = ["회원 가입 유형 선택", "회원 정보 입력", "회원 가입 완료"];
    const typeOk = s.type !== "";
    const termsOk = s.agree[0] && s.agree[1];
    const tn = T.filter((t) => t.k === s.type)[0];
    return {
      title: "회원 가입",
      lead: "서두르지 않아도 괜찮아요. 가입하고, 나의 속도로 시작해요.",
      showSteps: true,
      steps: SL.map((l, i) => ({
        no: "0" + (i + 1),
        label: l,
        cls: i < cur ? "ie-su-step is-done" : "ie-su-step",
        current: i === cur ? "step" : "false",
        sr: i < cur ? "(끝냈어요)" : i === cur ? "(지금 단계)" : "",
      })),
      hdrRole: "guest-plain",
      isType: s.phase === "type",
      isForm: s.phase === "form",
      isDone: s.phase === "done",
      isCheck: s.phase === "check",
      isGuide: s.phase === "guide",
      types: T.map((t) => ({
        name: t.name,
        desc: t.desc,
        tile: t.tile,
        i1: t.icon === "U1",
        i2: t.icon === "U2",
        i3: t.icon === "U3",
        on: s.type === t.k,
        pickLabel: s.type === t.k ? "선택했어요" : "선택",
        pick: () => this.setState({ type: t.k, tryType: false }),
      })),
      typeBad: s.tryType && !typeOk,
      teacherNotice: s.type === "tch",
      typeAlertOn: s.tryType && (!typeOk || !termsOk),
      typeAlertMsg:
        !typeOk && !termsOk
          ? "위에서 가입 유형을 고르고, 필수 동의에 체크해야 가입할 수 있어요."
          : !typeOk
            ? "위에서 가입 유형을 먼저 골라 주세요. 14세 미만 학생, 14세 이상 학생, 이음쌤 중 하나예요."
            : "필수 동의 두 가지에 모두 체크해야 가입할 수 있어요.",
      terms: TERMS.map((t, i) => ({
        label: t[0],
        href: t[1],
        on: s.agree[i],
        toggle: (e) => {
          const a = s.agree.slice();
          a[i] = e.target.checked;
          this.setState({ agree: a });
        },
      })),
      termsBad: s.tryType && !termsOk,
      goForm: () => {
        if (!typeOk || !termsOk) {
          this.setState({ tryType: true });
          return;
        }
        this.setState({ phase: "form", tried: false });
      },
      resetAll: () => this.setState(this.initState()),
      toType: () => this.setState({ phase: "type" }),
      backType: () => this.setState({ phase: "type" }),
      typeName: tn ? tn.name : "",
      isTeacher: teacher,
      under14,
      name: s.name,
      uid: s.uid,
      nick: s.nick,
      pw: s.pw,
      pwConfirm: s.pwConfirm,
      email: s.email,
      org: s.org,
      submitLabel: under14 ? "다음 · 보호자 동의" : "가입하기",
      nameBad: bad.name,
      idBad: bad.uid,
      nickBad: bad.nick,
      pwBad: bad.pw,
      pwConfirmBad: s.tried && (s.pwConfirm === "" || s.pwConfirm !== s.pw),
      birthBad: bad.birth,
      phoneBad: bad.phone,
      birthMsg,
      birthCls: cls(bad.birth),
      phoneCls: cls(bad.phone),
      birth: s.birth,
      phone: s.phone,
      hasErr: s.tried && anyInv,
      errList: [
        ["name", "이름"],
        ["uid", "아이디"],
        ["nick", "닉네임"],
        ["pw", "비밀번호"],
        ["pwConfirm", "비밀번호 재확인"],
        ["birth", "생년월일"],
        ["phone", "연락처"],
        ["mail", "이메일"],
      ]
        .filter((x) => inv[x[0]])
        .map((x) => x[1])
        .join(", "),
      mailBad: bad.mail,
      mailCls: cls(bad.mail),
      mailMsgOn: bad.mail,
      mailMsg: s.email.trim() === "" ? "이메일 주소를 적어 주세요." : "이메일 주소를 다시 확인해 주세요.",
      nameCls: cls(bad.name),
      idCls: cls(bad.uid),
      nickCls: cls(bad.nick),
      pwCls: cls(bad.pw),
      pwConfirmCls: cls(
        s.tried && (s.pwConfirm === "" || s.pwConfirm !== s.pw),
      ),
      onName: (e) => this.setState({ name: e.target.value }),
      onUid: (e) => this.setState({ uid: e.target.value }),
      onNick: (e) => this.setState({ nick: e.target.value }),
      onPw: (e) => this.setState({ pw: e.target.value }),
      onPwConfirm: (e) => this.setState({ pwConfirm: e.target.value }),
      onBirth: (e) => this.setState({ birth: e.target.value }),
      onPhone: (e) => this.setState({ phone: e.target.value }),
      onEmail: (e) => this.setState({ email: e.target.value }),
      onOrg: (e) => this.setState({ org: e.target.value }),
      submit: async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const g = (id, cur) => {
          try {
            const el = document.getElementById(id) as any;
            return el && typeof el.value === "string" ? el.value : cur;
          } catch (err) {
            return cur;
          }
        };
        const v = {
          name: g("su-name", s.name),
          uid: g("su-id", s.uid),
          nick: g("su-nick", s.nick),
          pw: g("su-pw", s.pw),
          pwConfirm: g("su-pw-confirm", s.pwConfirm),
          birth: g("su-birth", s.birth),
          phone: g("su-phone", s.phone),
          email: g("su-mail", s.email),
          org: g("su-org", s.org),
        };
        const d2 = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v.birth)
          ? new Date(v.birth + "T00:00:00")
          : null;
        let a2 = -1;
        if (d2 !== null && d2 <= now) {
          a2 = now.getFullYear() - d2.getFullYear();
          if (
            now.getMonth() < d2.getMonth() ||
            (now.getMonth() === d2.getMonth() && now.getDate() < d2.getDate())
          )
            a2 -= 1;
        }
        const okBirth = teacher
          ? d2 !== null && d2 <= now
          : d2 !== null && d2 <= now && (s.type === "u14") === a2 < 14;
        const inv2 = {
          name: v.name.trim() === "",
          uid: !/^[A-Za-z0-9]{4,20}$/.test(v.uid.trim()),
          nick: v.nick.trim() === "",
          pw: v.pw.length < 8,
          pwConfirm: v.pwConfirm === "" || v.pwConfirm !== v.pw,
          birth: !okBirth,
          phone: !/^0[0-9]{9,10}$/.test(v.phone.replace(/[^0-9]/g, "")),
          mail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()),
        };
        if (Object.values(inv2).some(Boolean)) {
          const first = [
            ["name", "su-name"],
            ["uid", "su-id"],
            ["nick", "su-nick"],
            ["pw", "su-pw"],
            ["pwConfirm", "su-pw-confirm"],
            ["birth", "su-birth"],
            ["phone", "su-phone"],
            ["mail", "su-mail"],
          ].filter((x) => inv2[x[0]])[0];
          this.setState(Object.assign({ tried: true }, v));
          setTimeout(() => {
            try {
              const el = document.getElementById(first[1]) as any;
              if (el) el.focus();
            } catch (err) {}
          }, 0);
          return;
        }
        // 14세 미만은 보호자 정보까지 받은 뒤 한 번에 가입 요청을 보낸다
        if (under14) {
          this.setState(Object.assign({ phase: "guardian", tried: false, submitErr: "" }, v));
          return;
        }
        if (s.submitting) return;
        this.setState({ submitting: true, submitErr: "" });
        try {
          const res = await authService.signup(this.buildSignup({ ...s, ...v }));
          // 서버가 보호자 확인이 필요하다고 하면 대기 화면, 아니면 가입 완료 화면
          this.setState(
            Object.assign(
              { phase: res && res.status === "PENDING_GUARDIAN" ? "wait" : "done", tried: false, submitting: false },
              v,
            ),
          );
        } catch (err: any) {
          // 이음쌤 가입이 닫혀 있으면(403 TEACHER_SIGNUP_CLOSED) 서버 message(문의 연락처 포함)가
          // 그대로 오류 문구가 돼요. ApiError 에는 code 가 없지만 http()가 서버 message 를 담아 주고,
          // 성공 때만 phase 를 바꾸므로 입력 화면과 값은 그대로 남아요.
          this.setState({
            submitting: false,
            submitErr: err?.message || "가입에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
          });
        }
      },
      submitErr: s.submitErr,
      submitting: s.submitting,
      isGuardian: s.phase === "guardian",
      isWait: s.phase === "wait",
      gName: s.gName,
      gContact: s.gContact,
      gAgree: s.gAgree,
      gUnsent: s.gUnsent,
      gNameBad: s.gTried && s.gName.trim() === "",
      gRel: s.gRel,
      gRelBad: s.gTried && s.gRel === "",
      gConBad: s.gTried && s.gContact.trim() === "",
      gAgreeBad: s.gTried && !s.gAgree,
      gNameCls: s.gTried && s.gName.trim() === "" ? "ie-input is-error" : "ie-input",
      gRelCls: s.gTried && s.gRel === "" ? "ie-select is-error" : "ie-select",
      gConCls: s.gTried && s.gContact.trim() === "" ? "ie-input is-error" : "ie-input",
      onGName: (e) => this.setState({ gName: e.target.value, gUnsent: false }),
      onGRel: (e) => this.setState({ gRel: e.target.value, gUnsent: false }),
      onGCon: (e) => this.setState({ gContact: e.target.value, gUnsent: false }),
      onGAgree: (e) => this.setState({ gAgree: e.target.checked, gUnsent: false }),
      gSubmit: async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const g = (id, cur) => {
          try {
            const el = document.getElementById(id) as any;
            return el && typeof el.value === "string" ? el.value : cur;
          } catch (err) {
            return cur;
          }
        };
        const gName = g("g-name", s.gName);
        const gRel = s.gRel || g("g-rel", "");
        const gContact = g("g-con", s.gContact);
        if (gName.trim() === "" || gRel === "" || gContact.trim() === "" || !s.gAgree) {
          this.setState({ gName, gRel, gContact, gTried: true, gUnsent: false });
          return;
        }
        if (s.submitting) return;
        this.setState({ gName, gRel, gContact, submitting: true, submitErr: "" });
        try {
          const res = await authService.signup(
            this.buildSignup(s, { name: gName, relation: gRel, contact: gContact }),
          );
          this.setState({
            gTried: false,
            phase: res && res.status === "ACTIVE" ? "done" : "wait",
            submitting: false,
          });
        } catch (err: any) {
          this.setState({
            submitting: false,
            submitErr: err?.message || "가입에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
          });
        }
      },
      backForm: () => this.setState({ phase: "form", gUnsent: false }),
      toGuardian: () => this.setState({ phase: "guardian" }),
      toWait: () => this.setState({ phase: "wait" }),
      isTeacherDone: teacher,
      isLearnerDone: !teacher,
      isStudent: !teacher,
      birthHelp: teacher
        ? "본인 확인에 써요. 이음쌤도 꼭 입력해야 해요."
        : "만 14세 미만인지 확인하는 데 써요.",
      nickName: s.nick.trim() === "" ? "친구" : s.nick.trim(),
      toCheck: () => this.setState({ phase: "check" }),
      toGuide: () => this.setState({ phase: "guide" }),
      finishCheck: () => this.setState({ phase: "guide" }),
      qs: Q.map((q) => ({
        text: q.text,
        opts: F.map((f, i) => ({
          mouth: f[1],
          fill: f[2],
          label: f[0],
          on: s.ans[q.k] === i,
          pick: () => this.setState({ ans: Object.assign({}, s.ans, { [q.k]: i }) }),
        })),
      })),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="ie-root ie-shell">
        <div className="ie-header-slot">
          <Header active="none" role={v.hdrRole} />
        </div>
        <div className="ie-body-row">
          <main className="ie-main ie-authmain" style={{ margin: "0 auto", width: "100%" }}>
            <div className="ie-su ie-in" style={{ "--d": "1" } as CSSProperties}>
              <div className="ie-su-head">
                <h1 className="ie-title">{v.title}</h1>
                <p className="ie-body-lg ie-sub">{v.lead}</p>
              </div>
              {v.showSteps ? (
                <ol className="ie-su-steps" aria-label="가입 단계">
                  {(v.steps || []).map((st: any, __i0: number) => (
                    <Fragment key={__i0}>
                      <li className={st.cls} aria-current={st.current}>
                        <b>{st.no}</b>
                        <span>{st.label}</span>
                        <span className="ie-sr">{st.sr}</span>
                      </li>
                    </Fragment>
                  ))}
                </ol>
              ) : null}{" "}
              {v.isType ? (
                <section className="ie-stack" aria-labelledby="su-t" style={{ gap: "24px" }}>
                  <h2 id="su-t" className="ie-h2">
                    가입 유형을 골라 주세요
                  </h2>
                  <div className="ie-types" role="radiogroup" aria-label="회원 가입 유형">
                    {(v.types || []).map((t: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <button
                          type="button"
                          role="radio"
                          className="ie-type"
                          aria-checked={t.on}
                          onClick={t.pick}
                        >
                          <span
                            className={`ie-tile ${t.tile}`}
                            style={{ width: "64px", height: "64px", borderRadius: "20px" }}
                          >
                            {t.i1 ? (
                              <svg width="34" height="34" viewBox="0 0 256 256" aria-hidden="true">
                                <path
                                  d="M224,96a56,56,0,1,1-56-56A56,56,0,0,1,224,96Z"
                                  fill="#D9CFFF"
                                />
                                <path
                                  d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                                  fill="#4E3FA6"
                                />
                              </svg>
                            ) : null}
                            {t.i2 ? (
                              <svg width="34" height="34" viewBox="0 0 256 256" aria-hidden="true">
                                <path
                                  d="M224,96a56,56,0,1,1-56-56A56,56,0,0,1,224,96Z"
                                  fill="#BFDDFF"
                                />
                                <path
                                  d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                                  fill="#2B5C96"
                                />
                              </svg>
                            ) : null}
                            {t.i3 ? (
                              <svg width="34" height="34" viewBox="0 0 256 256" aria-hidden="true">
                                <path
                                  d="M224,96a56,56,0,1,1-56-56A56,56,0,0,1,224,96Z"
                                  fill="#B8E6D3"
                                />
                                <path
                                  d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                                  fill="#2A6A52"
                                />
                              </svg>
                            ) : null}
                          </span>{" "}
                          <b className="ie-h3">{t.name}</b>{" "}
                          <span className="ie-body ie-sub">{t.desc}</span>{" "}
                          <span className="ie-type-pick">{t.pickLabel}</span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  {v.typeBad ? (
                    <span className="ie-error-text" role="alert">
                      가입 유형을 하나 골라 주세요.
                    </span>
                  ) : null}
                  <div className="ie-alert ie-alert--info" role="note">
                    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                      <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" fill="#BFDDFF" />
                      <path
                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                        fill="#2B5C96"
                      />
                    </svg>
                    <div>
                      개인정보 수집·이용에 동의하지 않을 권리가 있어요. 다만 필수 항목에 동의하지
                      않으면 가입할 수 없어요. 만 14세 미만 학생은 보호자(법정대리인)의 동의가
                      필요해요.
                    </div>
                  </div>
                  <div className="ie-agree" role="group" aria-label="필수 동의">
                    {(v.terms || []).map((a: any, __i0: number) => (
                      <Fragment key={__i0}>
                        <div>
                          <div className="ie-agree-row">
                            <label className="ie-native">
                              <input type="checkbox" checked={a.on} onChange={a.toggle} />
                              <span>
                                {a.label} <b className="ie-req">필수</b>
                              </span>
                            </label>{" "}
                            <A className="ie-btn ie-btn--text ie-btn--sm" href={a.href}>
                              전문 보기
                              <span className="ie-sr">
                                {" ("}
                                {a.label})
                              </span>
                            </A>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  {v.termsBad ? (
                    <span className="ie-error-text" role="alert">
                      필수 동의 항목에 모두 체크해 주세요.
                    </span>
                  ) : null}
                  <div className="ie-su-sec">
                    <h2 className="ie-h3">일반 계정 회원 가입</h2>
                    {v.teacherNotice ? (
                      <div className="ie-alert ie-alert--info" role="note">
                        <div>
                          이음쌤은 기관 확인을 거친 분만 가입할 수 있어요. 가입 문의는 담당자에게 해
                          주세요.
                        </div>
                      </div>
                    ) : null}
                    {v.typeAlertOn ? (
                      <div className="ie-alert ie-alert--error" role="alert">
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
                        <div>{v.typeAlertMsg}</div>
                      </div>
                    ) : null}
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--primary ie-btn--lg"
                        onClick={v.goForm}
                      >
                        회원 가입
                      </button>
                      <A className="ie-btn ie-btn--text" href={ROUTES.login} onClick={v.resetAll}>
                        이미 계정이 있어요 · 로그인
                      </A>
                    </div>
                  </div>
                </section>
              ) : null}{" "}
              {v.isForm ? (
                <section className="ie-card" aria-labelledby="su-f" style={{ gap: "20px" }}>
                  <div className="ie-row-between">
                    <h2 id="su-f" className="ie-h2">
                      회원 정보 입력
                    </h2>
                    <span className="ie-tag ie-tag--topic">{v.typeName}</span>
                  </div>
                  <form
                    className="ie-stack-s"
                    style={{ gap: "16px" }}
                    onSubmit={v.submit}
                    noValidate
                  >
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-name">
                        {"이름 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-name"
                        className={v.nameCls}
                        type="text"
                        autoComplete="name"
                        value={v.name}
                        onChange={v.onName}
                        aria-invalid={v.nameBad}
                        aria-describedby="su-name-e"
                        maxLength={30}
                      />{" "}
                      {v.nameBad ? (
                        <span id="su-name-e" className="ie-error-text">
                          이름을 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-id">
                        {"아이디 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-id"
                        className={v.idCls}
                        type="text"
                        autoComplete="username"
                        value={v.uid}
                        onChange={v.onUid}
                        aria-invalid={v.idBad}
                        aria-describedby="su-id-h su-id-e"
                        maxLength={20}
                      />{" "}
                      <span id="su-id-h" className="ie-help">
                        영어와 숫자로 4~20자예요.
                      </span>{" "}
                      {v.idBad ? (
                        <span id="su-id-e" className="ie-error-text">
                          아이디를 영어와 숫자로 4~20자로 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-nick">
                        {"닉네임 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-nick"
                        className={v.nickCls}
                        type="text"
                        value={v.nick}
                        onChange={v.onNick}
                        maxLength={20}
                        aria-invalid={v.nickBad}
                        aria-describedby="su-nick-h su-nick-e"
                      />{" "}
                      <span id="su-nick-h" className="ie-help">
                        화면에서는 이 이름으로 불러요. 실명은 보이지 않아요.
                      </span>{" "}
                      {v.nickBad ? (
                        <span id="su-nick-e" className="ie-error-text">
                          닉네임을 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-pw">
                        {"비밀번호 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-pw"
                        className={v.pwCls}
                        type="password"
                        autoComplete="new-password"
                        value={v.pw}
                        onChange={v.onPw}
                        aria-invalid={v.pwBad}
                        aria-describedby="su-pw-h su-pw-e"
                        maxLength={72}
                      />{" "}
                      <span id="su-pw-h" className="ie-help">
                        8자 이상이에요.
                      </span>{" "}
                      {v.pwBad ? (
                        <span id="su-pw-e" className="ie-error-text">
                          비밀번호를 8자 이상으로 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-pw-confirm">
                        {"비밀번호 재확인 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-pw-confirm"
                        className={v.pwConfirmCls}
                        type="password"
                        autoComplete="new-password"
                        value={v.pwConfirm}
                        onChange={v.onPwConfirm}
                        aria-invalid={v.pwConfirmBad}
                        aria-describedby="su-pw-confirm-h su-pw-confirm-e"
                        maxLength={72}
                      />{" "}
                      <span id="su-pw-confirm-h" className="ie-help">
                        비밀번호를 한 번 더 적어 주세요.
                      </span>{" "}
                      {v.pwConfirmBad ? (
                        <span id="su-pw-confirm-e" className="ie-error-text">
                          {v.pwConfirm === ""
                            ? "비밀번호를 다시 적어 주세요."
                            : "비밀번호가 서로 달라요. 다시 확인해 주세요."}
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-birth">
                        {"생년월일 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-birth"
                        className={v.birthCls}
                        type="date"
                        autoComplete="bday"
                        value={v.birth}
                        onChange={v.onBirth}
                        aria-invalid={v.birthBad}
                        aria-describedby="su-birth-h su-birth-e"
                      />{" "}
                      <span id="su-birth-h" className="ie-help">
                        {v.birthHelp}
                      </span>{" "}
                      {v.birthBad ? (
                        <span id="su-birth-e" className="ie-error-text">
                          {v.birthMsg}
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-phone">
                        {"연락처(휴대폰 번호) "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-phone"
                        className={v.phoneCls}
                        type="tel"
                        autoComplete="tel"
                        inputMode="numeric"
                        value={v.phone}
                        onChange={v.onPhone}
                        aria-invalid={v.phoneBad}
                        aria-describedby="su-phone-h su-phone-e"
                      />{" "}
                      <span id="su-phone-h" className="ie-help">
                        숫자만 적어도 돼요. 예: 01012345678
                      </span>{" "}
                      {v.phoneBad ? (
                        <span id="su-phone-e" className="ie-error-text">
                          휴대폰 번호를 숫자 10~11자리로 적어 주세요.
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-mail">
                        {"이메일 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="su-mail"
                        className={v.mailCls}
                        type="email"
                        autoComplete="email"
                        value={v.email}
                        onChange={v.onEmail}
                        aria-invalid={v.mailBad}
                        aria-describedby="su-mail-h su-mail-e"
                        maxLength={100}
                      />{" "}
                      <span id="su-mail-h" className="ie-help">
                        자주 쓰는 이메일 주소를 적어 주세요.
                      </span>{" "}
                      {v.mailMsgOn ? (
                        <span id="su-mail-e" className="ie-error-text" role="alert">
                          {v.mailMsg}
                        </span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="su-org">
                        {"소속 학교 · 기관 "}
                        <span className="ie-opt">선택</span>
                      </label>{" "}
                      <input
                        id="su-org"
                        className="ie-input"
                        type="text"
                        value={v.org}
                        onChange={v.onOrg}
                        maxLength={50}
                      />
                    </div>
                    {v.under14 ? (
                      <div className="ie-alert ie-alert--info" role="note">
                        <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
                          <path
                            d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                            fill="#BFDDFF"
                          />
                          <path
                            d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"
                            fill="#2B5C96"
                          />
                        </svg>
                        <div>
                          <b>다음 화면에서 보호자 정보를 적어요.</b>
                          <br />
                          운영 기관이 보호자의 동의를 확인해야 학습을 시작할 수 있어요. 시설에서
                          지내는 경우에는 동의하는 분이 누구인지 따로 확인해요.
                        </div>
                      </div>
                    ) : null}{" "}
                    {v.hasErr ? (
                      <div className="ie-alert ie-alert--error" role="alert">
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
                        <div>
                          <b>
                            {"아직 확인이 필요한 곳: "}
                            {v.errList}
                          </b>
                          <br />
                          적은 내용은 그대로 두었으니, 표시된 곳만 고쳐 주세요.
                        </div>
                      </div>
                    ) : null}
                    {v.submitErr ? (
                      <div className="ie-alert ie-alert--info" role="alert">
                        {v.submitErr}
                      </div>
                    ) : null}
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline ie-btn--lg"
                        onClick={v.backType}
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        className="ie-btn ie-btn--primary ie-btn--lg"
                        onClick={v.submit}
                      >
                        {v.submitLabel}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}{" "}
              {v.isGuardian ? (
                <section className="ie-card" aria-labelledby="gd-t" style={{ gap: "20px" }}>
                  <div className="ie-row-between">
                    <h2 id="gd-t" className="ie-h2">
                      보호자(법정대리인) 동의
                    </h2>
                    <span className="ie-tag ie-tag--topic">만 14세 미만</span>
                  </div>
                  <p className="ie-body ie-sub">
                    보호자 정보를 받아 두면 운영 기관이 보호자에게 직접 동의를 확인해요. 동의 확인이
                    끝나기 전에는 학습을 시작할 수 없어요. 학생 본인의 이름과 닉네임 말고는
                    보호자에게 보여 주지 않아요.
                  </p>
                  <form
                    className="ie-stack-s"
                    style={{ gap: "16px" }}
                    onSubmit={v.gSubmit}
                    noValidate
                  >
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="g-name">
                        {"보호자 이름 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="g-name"
                        className={v.gNameCls}
                        type="text"
                        value={v.gName}
                        onChange={v.onGName}
                        aria-invalid={v.gNameBad}
                        maxLength={30}
                      />{" "}
                      {v.gNameBad ? (
                        <span className="ie-error-text">보호자 이름을 적어 주세요.</span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="g-rel">
                        {"관계 "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <select
                        id="g-rel"
                        className={v.gRelCls}
                        value={v.gRel}
                        onChange={v.onGRel}
                        aria-invalid={v.gRelBad}
                      >
                        <option value="">관계를 골라 주세요</option>
                        <option value="부모">부모</option>
                        <option value="조부모·친척">조부모·친척</option>
                        <option value="시설 보호자">시설 보호자</option>
                        <option value="그 밖의 법정대리인">그 밖의 법정대리인</option>
                      </select>{" "}
                      {v.gRelBad ? (
                        <span className="ie-error-text">관계를 골라 주세요.</span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-label" htmlFor="g-con">
                        {"연락처 (전화번호 또는 이메일) "}
                        <span className="ie-req">필수</span>
                      </label>{" "}
                      <input
                        id="g-con"
                        className={v.gConCls}
                        type="text"
                        value={v.gContact}
                        onChange={v.onGCon}
                        aria-invalid={v.gConBad}
                        aria-describedby="g-con-h"
                        maxLength={100}
                      />{" "}
                      <span id="g-con-h" className="ie-help">
                        동의를 확인할 연락처예요. 다른 용도로 쓰지 않아요.
                      </span>{" "}
                      {v.gConBad ? (
                        <span className="ie-error-text">연락처를 적어 주세요.</span>
                      ) : null}
                    </div>
                    <div className="ie-field">
                      <label className="ie-native">
                        <input type="checkbox" checked={v.gAgree} onChange={v.onGAgree} />
                        {" 위 보호자에게 동의를 확인하는 것을 알고 있어요 "}
                        <b className="ie-req">필수</b>
                      </label>{" "}
                      {v.gAgreeBad ? (
                        <span className="ie-error-text">확인에 체크해 주세요.</span>
                      ) : null}
                    </div>
                    {v.submitErr ? (
                      <div className="ie-alert ie-alert--info" role="alert">
                        {v.submitErr}
                      </div>
                    ) : null}
                    <div className="ie-row">
                      <button
                        type="button"
                        className="ie-btn ie-btn--outline ie-btn--lg"
                        onClick={v.backForm}
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        className="ie-btn ie-btn--primary ie-btn--lg"
                        onClick={v.gSubmit}
                      >
                        보호자 정보 보내기
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}{" "}
              {v.isWait ? (
                <section
                  className="ie-card ie-card--hero ie-card--sky"
                  role="status"
                  style={{ gap: "16px", alignItems: "flex-start" }}
                >
                  <h2 className="ie-h2">보호자 확인을 기다리고 있어요</h2>
                  <p className="ie-body-lg">
                    보호자 정보를 받았어요. 운영 기관에서 보호자 동의를 확인하면 같은 아이디로
                    로그인해서 시작할 수 있어요. 그때까지는 학습을 시작할 수 없어요.
                  </p>
                  <ol className="ie-timeline">
                    <li className="ie-tl-item is-done">
                      <span className="ie-tl-mark">
                        <span className="ie-tl-dot" />
                        <span className="ie-tl-line" />
                      </span>
                      <span className="ie-tl-body">
                        <b className="ie-body ie-strong">회원 정보와 보호자 정보 입력</b>
                      </span>
                    </li>
                    <li className="ie-tl-item is-now">
                      <span className="ie-tl-mark">
                        <span className="ie-tl-dot" />
                        <span className="ie-tl-line" />
                      </span>
                      <span className="ie-tl-body">
                        <b className="ie-body ie-strong">보호자 동의 확인 중</b>
                        <span className="ie-meta">
                          운영 기관이 보호자에게 직접 확인해요. 시간이 걸릴 수 있어요.
                        </span>
                      </span>
                    </li>
                    <li className="ie-tl-item">
                      <span className="ie-tl-mark">
                        <span className="ie-tl-dot" />
                      </span>
                      <span className="ie-tl-body">
                        <b className="ie-body ie-strong">로그인해서 시작</b>
                      </span>
                    </li>
                  </ol>
                  <div className="ie-row">
                    <A className="ie-btn ie-btn--primary" href={ROUTES.login} onClick={v.resetAll}>
                      로그인 화면으로
                    </A>
                    <A className="ie-btn ie-btn--text" href={ROUTES.landing} onClick={v.resetAll}>
                      처음 화면으로
                    </A>
                  </div>
                </section>
              ) : null}{" "}
              {v.isDone ? (
                <section
                  className="ie-card ie-card--hero ie-card--mint"
                  role="status"
                  style={{ gap: "16px", alignItems: "flex-start" }}
                >
                  <h2 className="ie-h2">가입 완료</h2>
                  <p className="ie-body-lg">
                    {v.nickName}
                    님, 이음에 오신 걸 환영해요. 로그인하고 나의 속도로 시작해요. 점수나 순위는
                    없어요.
                  </p>
                  {v.isTeacherDone ? (
                    <p className="ie-body">
                      이음쌤으로 가입했어요. 로그인하면 이음쌤 홈으로 가요. 학습자가 쪽지를 보내면
                      배정돼요.
                    </p>
                  ) : null}
                  <div className="ie-row">
                    <A
                      className="ie-btn ie-btn--primary ie-btn--lg"
                      href={ROUTES.login}
                      onClick={v.resetAll}
                    >
                      로그인하러 가기
                    </A>
                  </div>
                </section>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    );
  }
}
