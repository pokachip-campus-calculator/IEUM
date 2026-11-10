// @ts-nocheck
/**
 * S05 홈 — 이음 마을 3D 엔진 (three.js + GLB)
 *
 * 기존 villageEngine.ts(8장의 그림을 이어 붙이던 방식)를 대신해서, 진짜 3D 모델(public/models/village.glb)을
 * 그려요. 화면 구성(이름표·카드·점·좌우 버튼·확대/축소 버튼)은 그대로 쓰고 '마을 그림'만 바뀌었어요.
 *
 * 입력
 *  - 마우스 휠 / 트랙패드: 마을의 장소를 한 곳씩 둘러봐요.
 *  - 끌기(마우스·터치): 돌리기. 놓으면 살짝 관성이 남아요.
 *  - 건물/이름표 클릭, 점, 좌우 버튼, 방향키: 한 곳씩 가까이 보기
 *  - 두 손가락 벌리기, +/- 키, 오른쪽 아래 버튼: 확대·축소
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// ── 모델 안의 장소 위치(모델 좌표). 모델을 눈으로 보며 지붕 위 한 점씩 잡아 둔 값이에요.
const SPOTS = {
  book: [0, 0.577, -0.625], // 책 모양 지붕의 큰 건물(맨 안쪽)
  pink: [-0.475, 0.489, -0.259], // 분홍 집
  yellow: [0.473, 0.498, -0.243], // 노랑·보라 집
  blueL: [-0.615, 0.416, 0.209], // 왼쪽 파랑 집
  orange: [-0.336, 0.409, 0.637], // 앞쪽 왼쪽 주황 집
  dome: [0.275, 0.42, 0.753], // 앞쪽 오른쪽 파랑 둥근 집
  purple: [0.6, 0.427, 0.441], // 오른쪽 보라 집
  fountain: [0, 0.346, 0.086], // 가운데 분수
};
// 장소 순서(data-k): 학습 영역, 도움 받을 수 있는 곳, 이음상담소, 내 쪽지함, 알림, 내 학습 기록, 내 정보
// (감정 읽기·안전·도움 구하기는 홈에서 빼서, 비어 있던 분홍·노랑·파랑 집을 알림·내 학습 기록·내 정보가 써요.)
// [어느 건물, 같은 건물을 같이 쓸 때 옆으로 비켜 줄 정도]
const MAP = [
  ["book", 0], // 학습 영역
  ["purple", 0], // 도움 받을 수 있는 곳
  ["orange", 0], // 이음상담소
  ["dome", 0], // 내 쪽지함
  ["pink", 0], // 알림
  ["yellow", 0], // 내 학습 기록
  ["blueL", 0], // 내 정보
];
const HIT = { book: 0.26, pink: 0.18, yellow: 0.18, blueL: 0.18, orange: 0.18, dome: 0.18, purple: 0.18, fountain: 0.2 };
const CENTER = [0, 0.18, 0]; // 마을 전체를 볼 때 바라보는 점
const MODEL_URL = (import.meta.env.BASE_URL || "/") + "models/village.glb";
const FOV = 28;
const EL = (28 * Math.PI) / 180; // 보는 높이각(고정)

export function startVillage(this: any): void {
  const root = document.querySelector(".ie-w3") as any;
  if (!root || root.__w3) return;
  const st = root.querySelector(".ie-w3stage");
  const map = root.querySelector(".ie-3map");
  if (!st || !map) return;
  root.__w3 = true;
  const labs = Array.prototype.slice.call(root.querySelectorAll(".ie-3lab"));
  const items = Array.prototype.slice.call(root.querySelectorAll(".ie-w3item"));
  const dots = Array.prototype.slice.call(root.querySelectorAll(".ie-w3dot"));
  const live = root.querySelector(".ie-w3live");
  const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // 예전 그림 조각은 더 이상 쓰지 않아요
  Array.prototype.forEach.call(map.querySelectorAll(".ie-3fr"), (el) => {
    el.style.display = "none";
  });

  const NB = MAP.length,
    NS = NB + 1;
  const NEAR = SPOTS && MAP.map((m) => new THREE.Vector3(...SPOTS[m[0]]).add(new THREE.Vector3(m[1], 0, 0)));
  const labPos = NEAR.map((p) => p.clone().add(new THREE.Vector3(0, 0.07, 0))); // 이름표가 붙는 곳(지붕 살짝 위)
  const lookPos = NEAR.map((p) => p.clone().add(new THREE.Vector3(0, -0.14, 0))); // 가까이 갈 때 가운데
  const SPOT_KEYS = Object.keys(SPOTS);
  const SPOT_V = SPOT_KEYS.map((k) => new THREE.Vector3(SPOTS[k][0], SPOTS[k][1] - 0.12, SPOTS[k][2]));

  // ── three.js 준비
  let renderer: any = null,
    scene: any = null,
    cam: any = null,
    model: any = null,
    disposed = false;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    root.classList.add("is-nogl");
  }
  const canvas = renderer && renderer.domElement;
  if (canvas) {
    canvas.style.cssText =
      "position:absolute;left:0;top:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .7s ease";
    map.appendChild(canvas);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(FOV, 1, 0.02, 40);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      MODEL_URL,
      (g) => {
        if (disposed) return;
        model = g.scene;
        const aniso = renderer.capabilities.getMaxAnisotropy();
        model.traverse((o) => {
          if (!o.isMesh) return;
          // 그림자·빛이 이미 구워져 있는 모델이라(emissive 텍스처) 빛 계산 없이 그대로 보여 줘요
          const m = o.material,
            tex = m.map || m.emissiveMap;
          if (tex) {
            tex.anisotropy = aniso;
            tex.colorSpace = THREE.SRGBColorSpace;
            o.material = new THREE.MeshBasicMaterial({ map: tex });
            m.dispose();
          }
          o.frustumCulled = false;
        });
        scene.add(model);
        canvas.style.opacity = "1";
        wake();
      },
      undefined,
      () => {
        root.classList.add("is-nogl");
      },
    );
  }

  const cur = { x: CENTER[0], y: CENTER[1], z: CENTER[2], s: 100 };
  const goal = { x: CENTER[0], y: CENTER[1], z: CENTER[2], s: 100 };
  let tp = 0,
    tt = 0; // 지금 보는 각도(°), 가려는 각도(°)
  let overlay = false,
    uz = 1,
    step = -1,
    W = 1,
    H = 1,
    padT = 56,
    padB = 16,
    raf = 0,
    last = 0,
    used = false,
    cy0 = 300,
    wheelUntil = 0,
    wheelLockUntil = 0;
  const TH = Math.tan((FOV * Math.PI) / 360);

  // 첫 화면에서 마을을 더 크게 보여 주되, 좁은 화면에서는 가장자리를 자르지 않아요.
  const fitOf = () => {
    const k = overlay ? 1.12 : W < 720 ? 1.0 : 1.42;
    return Math.max(20, Math.min((W - 32) / 1.95, (H - padT - padB) / 1.78) * k);
  };
  const setGoal = () => {
    if (step <= 0) {
      goal.x = CENTER[0];
      goal.y = CENTER[1];
      goal.z = CENTER[2];
      goal.s = fitOf();
      return;
    }
    const p = lookPos[step - 1];
    goal.x = p.x;
    goal.y = p.y;
    goal.z = p.z;
    goal.s = Math.min(fitOf() * 2.7, Math.max(W * 0.5, 320) / 0.55);
  };

  const V = new THREE.Vector3();
  const place = () => {
    const s = cur.s * uz;
    const dist = H / (2 * TH * s);
    const a = (tp * Math.PI) / 180;
    cam.position.set(
      cur.x + dist * Math.sin(a) * Math.cos(EL),
      cur.y + dist * Math.sin(EL),
      cur.z + dist * Math.cos(a) * Math.cos(EL),
    );
    cam.lookAt(cur.x, cur.y, cur.z);
    cam.aspect = W / H;
    // 바라보는 점이 화면 정중앙이 아니라 위·아래 여백을 뺀 가운데(cy0)에 오도록 밀어 줘요
    cam.setViewOffset(W, H, 0, -(cy0 - H / 2), W, H);
    cam.near = Math.max(0.01, dist * 0.2);
    cam.far = dist + 6;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    return s;
  };
  const toScreen = (p) => {
    V.copy(p).project(cam);
    return [(V.x * 0.5 + 0.5) * W, (-V.y * 0.5 + 0.5) * H, V.z];
  };

  // ── 이름표 (겹침 회피는 '밀어낸 정도'만 보간 · 이전 자리 유지)
  const LW = [],
    LH = [];
  const CX = [0, -0.55, 0.55, -1.05, 1.05, -1.6, 1.6],
    CY = [0, -0.5, 0.5, -1, 1, 1.5, -2, 2];
  const LS = [];
  let small = null,
    ldt = 0.016,
    labBusy = false,
    labSnap = true;

  const draw = () => {
    const s = cam ? place() : cur.s * uz;
    if (renderer && model) renderer.render(scene, cam);
    const sm = s < fitOf() * 0.8;
    if (sm !== small) {
      small = sm;
      root.classList.toggle("is-small", sm);
      for (let k = 0; k < labs.length; k++) LW[k] = 0;
    }
    if (!cam) return;
    const P: any[] = [];
    for (let k = 0; k < NB; k++) {
      const sc = toScreen(labPos[k]);
      const px = sc[0],
        py = sc[1];
      if (!LW[k]) {
        LW[k] = labs[k].offsetWidth || 120;
        LH[k] = labs[k].offsetHeight || 40;
      }
      const ls = LS[k] || (LS[k] = { ox: 0, oy: 0, sx: 0, sy: 0, gone: true });
      const w = LW[k],
        h = LH[k] + 8,
        m = ls.gone ? -30 : 30;
      P.push({
        k: k,
        ls: ls,
        ax: Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, px)),
        ay: py,
        w: w,
        h: h,
        out: py < -m || py - h > H + m || px < -w / 2 - m - 60 || px > W + w / 2 + m + 60,
        fix: k === step - 1,
      });
    }
    // 선택된 표 먼저, 그다음 화면 아래쪽(앞) 표가 우선
    P.sort((a, b) => b.fix - a.fix || b.ay - a.ay || a.k - b.k);
    for (let i = 0; i < P.length; i++) {
      const a = P[i],
        ls = a.ls;
      if (a.out) continue;
      const free = (ox, oy, pad) => {
        const x = a.ax + ox,
          y = a.ay + oy;
        if (y < a.h + 2 || y > H - 4 || x < a.w / 2 + 6 || x > W - a.w / 2 - 6) return false;
        for (let j = 0; j < i; j++) {
          const b = P[j];
          if (b.out) continue;
          if (Math.abs(x - b.tx) < (a.w + b.w) / 2 + 6 + pad && Math.abs(y - b.ty) < (a.h + b.h) / 2 + pad)
            return false;
        }
        return true;
      };
      let ox = ls.ox,
        oy = ls.oy,
        ok = false;
      if (a.fix) {
        ok = true;
        ox = 0;
        oy = 0;
      } else if ((ox !== 0 || oy !== 0) && free(0, 0, 14)) {
        ox = 0;
        oy = 0;
        ok = true;
      } else if (free(ox, oy, 0)) ok = true;
      if (!ok) {
        let bd = 1e9;
        for (let ix = 0; ix < CX.length; ix++)
          for (let iy = 0; iy < CY.length; iy++) {
            const cx = CX[ix] * a.w,
              cy = CY[iy] * a.h,
              d = Math.abs(cx - ls.ox) + Math.abs(cy - ls.oy) * 1.2 + (Math.abs(cx) + Math.abs(cy)) * 0.3;
            if (d < bd && free(cx, cy, 0)) {
              bd = d;
              ox = cx;
              oy = cy;
              ok = true;
            }
          }
      }
      ls.ox = ox;
      ls.oy = oy;
      a.tx = a.ax + ox;
      a.ty = a.ay + oy;
    }
    const lf = labSnap ? 1 : 1 - Math.exp(-ldt * 12);
    let busy = false;
    for (let i = 0; i < P.length; i++) {
      const a = P[i],
        ls = a.ls,
        el = labs[a.k];
      if (a.out) {
        if (!ls.gone) {
          ls.gone = true;
          el.classList.add("is-gone");
        }
        a.tx = a.ax;
        a.ty = a.ay;
        ls.ox = ls.oy = ls.sx = ls.sy = 0;
      } else {
        if (ls.gone) {
          ls.gone = false;
          ls.sx = ls.ox;
          ls.sy = ls.oy;
          el.classList.remove("is-gone");
        } else {
          ls.sx += (ls.ox - ls.sx) * lf;
          ls.sy += (ls.oy - ls.sy) * lf;
          if (Math.abs(ls.ox - ls.sx) < 0.3 && Math.abs(ls.oy - ls.sy) < 0.3) {
            ls.sx = ls.ox;
            ls.sy = ls.oy;
          } else busy = true;
        }
      }
      el.style.transform =
        "translate3d(" + (a.ax + ls.sx).toFixed(1) + "px," + (a.ay + ls.sy).toFixed(1) + "px,0) translate(-50%,-100%)";
    }
    labBusy = busy;
    labSnap = false;
  };

  const wake = () => {
    if (!raf && !disposed) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  let down = false,
    drag = false;
  const tick = (t) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.25, last ? (t - last) / 1000 : 0.016);
    last = t;
    ldt = dt;
    const wheeling = t < wheelUntil;
    // 위치·확대·회전이 비슷한 속도로 따라가서 한 덩어리처럼 움직여요
    const f = reduce ? 1 : 1 - Math.exp(-dt * (wheeling ? 7 : 5));
    const fr = reduce ? 1 : 1 - Math.exp(-dt * (down ? 16 : wheeling ? 7 : 5));
    tp += (tt - tp) * fr;
    setGoal();
    cur.x += (goal.x - cur.x) * f;
    cur.y += (goal.y - cur.y) * f;
    cur.z += (goal.z - cur.z) * f;
    cur.s += (goal.s - cur.s) * f;
    draw();
    const still =
      Math.abs(goal.x - cur.x) < 0.0003 &&
      Math.abs(goal.y - cur.y) < 0.0003 &&
      Math.abs(goal.z - cur.z) < 0.0003 &&
      Math.abs(goal.s - cur.s) < 0.05 &&
      Math.abs(tt - tp) < 0.02;
    if (!still || labBusy) raf = requestAnimationFrame(tick);
    else {
      setGoal();
      cur.x = goal.x;
      cur.y = goal.y;
      cur.z = goal.z;
      cur.s = goal.s;
      tp = tt;
      labSnap = true;
      draw();
    }
  };

  const setStep = (n) => {
    n = Math.max(0, Math.min(NS - 1, n));
    if (n === step) return;
    step = n;
    root.classList.toggle("is-near", step > 0);
    for (let k = 0; k < items.length; k++) {
      items[k].classList.toggle("is-on", k === step);
      const go = items[k].querySelector(".ie-w3go");
      if (go) go.tabIndex = k === step ? 0 : -1;
    }
    for (let k = 0; k < dots.length; k++) {
      dots[k].classList.toggle("is-on", k === step);
      dots[k].setAttribute("aria-current", k === step ? "true" : "false");
    }
    for (let k = 0; k < labs.length; k++) labs[k].classList.toggle("is-front", k === step - 1);
    uz = 1;
    updZ();
    setGoal();
    wake();
    const it = items[step];
    if (live && it)
      live.textContent = it.querySelector(".ie-w3nm").textContent + ". " + it.querySelector(".ie-w3ds").textContent;
  };
  const zbtn = Array.prototype.slice.call(root.querySelectorAll(".ie-3zb"));
  const updZ = () => {
    zbtn.forEach((b) => {
      const z = b.getAttribute("data-z");
      b.disabled = (z === "in" && uz >= 1.99) || (z === "out" && uz <= 0.56);
    });
  };
  const zoomBy = (f) => {
    uz = Math.max(0.55, Math.min(2, uz * f));
    updZ();
    wake();
  };
  const markUsed = () => {
    if (!used) {
      used = true;
      root.classList.add("is-used");
    }
  };

  // ── 크기 맞추기
  const fit = () => {
    W = st.clientWidth || 1;
    H = st.clientHeight || 1;
    // 3D 칸이 홈 전체를 덮는 풀스크린 배치면, 위쪽 안내(제목·버튼)와 아래 카드(dock) 위로 마을이 올라타지 않게
    // 실제 위치를 재서 마을이 앉을 위·아래 여백을 정해요. 그렇지 않은 배치(좁은 화면)는 예전 값 그대로예요.
    overlay = st.offsetHeight >= root.clientHeight - 2;
    if (overlay) {
      const dock = root.querySelector(".ie-w3dock");
      const dockTop = dock ? dock.offsetTop : H - 120;
      padB = Math.max(40, root.clientHeight - dockTop + 10);
      padT = 60;
    } else {
      padB = 8;
      padT = 40;
    }
    cy0 = padT + (H - padT - padB) / 2;
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
    }
    for (let k = 0; k < labs.length; k++) LW[k] = 0;
    setGoal();
    if (!raf) {
      cur.x = goal.x;
      cur.y = goal.y;
      cur.z = goal.z;
      cur.s = goal.s;
      draw();
    }
  };

  // ── 입력
  root.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (down) return;
      const d = e.deltaY || e.deltaX;
      if (!d) return;
      const now = performance.now();
      if (now < wheelLockUntil) {
        wheelLockUntil = now + 450;
        return;
      }
      setStep(step + (d > 0 ? 1 : -1));
      wheelUntil = now + 160;
      wheelLockUntil = now + 450;
      markUsed();
    },
    { passive: false },
  );

  let sx = 0,
    startT = 0,
    vel = 0,
    lx = 0,
    lt = 0;
  const ptrs = new Map();
  let pinch0 = 0,
    pinchUz = 1;
  const DPX = 0.3; // 한 번 끌 때 도는 각도(° / px)
  // 화면 좌표 → 어느 건물인지 (건물 위치를 화면에 옮겨 가장 가까운 것, 크기는 현재 배율에 맞춰요)
  const pick = (e) => {
    const r = st.getBoundingClientRect();
    const sc = r.width / (st.offsetWidth || r.width) || 1; // 앱 전체에 CSS zoom 이 걸려 있어도 맞도록 보정
    const mx = (e.clientX - r.left) / sc,
      my = (e.clientY - r.top) / sc;
    const s = cur.s * uz;
    let best = -1,
      bd = 1e9;
    for (let i = 0; i < SPOT_KEYS.length; i++) {
      const p = toScreen(SPOT_V[i]);
      const d = Math.hypot(mx - p[0], (my - p[1]) * 1.25);
      if (d < HIT[SPOT_KEYS[i]] * s && d < bd) {
        bd = d;
        best = i;
      }
    }
    if (best < 0) return -1;
    for (let k = 0; k < NB; k++) if (MAP[k][0] === SPOT_KEYS[best]) return k;
    return -1;
  };
  st.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest(".ie-3lab,.ie-3zoom")) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) {
      const p = Array.from(ptrs.values());
      pinch0 = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1;
      pinchUz = uz;
      drag = true; // 두 손가락 땐 클릭 취급하지 않아요
      return;
    }
    down = true;
    drag = false;
    sx = e.clientX;
    startT = tt;
    vel = 0;
    lx = e.clientX;
    lt = performance.now();
  });
  window.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) {
      const p = Array.from(ptrs.values());
      const d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) || 1;
      uz = Math.max(0.55, Math.min(2, pinchUz * (d / pinch0)));
      updZ();
      markUsed();
      wake();
      return;
    }
    if (down) {
      const mv = Math.abs(e.clientX - sx);
      if (!drag && mv > 6) {
        drag = true;
        st.classList.add("is-drag");
        markUsed();
        startT = tt;
        sx = e.clientX;
      }
      if (drag) {
        tt = startT - (e.clientX - sx) * DPX; // 오른쪽으로 끌면 앞쪽이 오른쪽으로 돌아요
        const now = performance.now(),
          dtm = Math.max(1, now - lt);
        vel = vel * 0.6 + (((lx - e.clientX) * DPX) / dtm) * 1000 * 0.4;
        lx = e.clientX;
        lt = now;
        wake();
      }
    } else if (st.contains(e.target) && !(e.target.closest && e.target.closest(".ie-3lab,.ie-3zoom"))) {
      st.classList.toggle("is-hot", pick(e) >= 0);
    }
  });
  const settle = () => {
    // 놓은 뒤 관성으로 조금 더 돌고 멈춰요(정면으로 끌어당기지 않아요)
    tt += Math.max(-120, Math.min(120, vel * 0.25));
    wake();
  };
  const up = (e) => {
    const had = ptrs.delete(e.pointerId);
    if (ptrs.size === 1) return;
    if (!down) {
      if (had && ptrs.size === 0) drag = false;
      return;
    }
    down = false;
    if (drag) {
      drag = false;
      st.classList.remove("is-drag");
      settle();
      return;
    }
    const k = pick(e);
    if (k >= 0) {
      setStep(k + 1);
      markUsed();
    }
  };
  window.addEventListener("pointerup", up);
  const cancel = (e) => {
    ptrs.delete(e.pointerId);
    if (down && drag) settle();
    down = false;
    drag = false;
    st.classList.remove("is-drag");
  };
  window.addEventListener("pointercancel", cancel);
  root.addEventListener("click", (e) => {
    const lab = e.target.closest && e.target.closest(".ie-3lab");
    if (lab) {
      const k = +lab.getAttribute("data-k");
      if (step !== k + 1) {
        e.preventDefault();
        setStep(k + 1);
        markUsed();
      }
      return;
    }
    const zb = e.target.closest && e.target.closest(".ie-3zb");
    if (zb) {
      const z = zb.getAttribute("data-z");
      if (z === "all") {
        uz = 1;
        updZ();
        setStep(0);
        wake();
      } else zoomBy(z === "in" ? 1.25 : 0.8);
      markUsed();
      return;
    }
    const dot = e.target.closest && e.target.closest(".ie-w3dot");
    if (dot) {
      setStep(+dot.getAttribute("data-k"));
      markUsed();
      return;
    }
    const nav = e.target.closest && e.target.closest(".ie-w3nav");
    if (nav) {
      setStep(step + (nav.classList.contains("ie-w3nav--next") ? 1 : -1));
      markUsed();
    }
  });
  st.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setStep(step + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setStep(step - 1);
    } else if (e.key === "[" || e.key === ",") {
      e.preventDefault();
      tt -= 30;
      wake();
    } else if (e.key === "]" || e.key === ".") {
      e.preventDefault();
      tt += 30;
      wake();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomBy(1.25);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomBy(0.8);
    } else if (e.key === "Home") {
      e.preventDefault();
      setStep(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setStep(NS - 1);
    } else if (e.key === "Enter" && step > 0) {
      const go = items[step].querySelector(".ie-w3go");
      if (go) go.click();
    }
  });
  let ro = null;
  if (window.ResizeObserver) {
    ro = new ResizeObserver(fit);
    ro.observe(st);
  }
  window.addEventListener("resize", fit);
  this.__w3off = () => {
    disposed = true;
    if (ro) ro.disconnect();
    window.removeEventListener("resize", fit);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    if (raf) cancelAnimationFrame(raf);
    if (model) {
      model.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }
    if (renderer) {
      renderer.dispose();
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
  tp = tt = 0;
  fit();
  setStep(0);
  if (!reduce) {
    cur.s = goal.s * 0.85;
    cur.y = goal.y - 0.08;
    wake();
  } else {
    Object.assign(cur, goal);
    draw();
  }
}
