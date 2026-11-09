// @ts-nocheck
/**
 * S05 홈 — 이음 마을 3D 회전목마 엔진
 *
 * 원본 디자인의 componentDidMount 안에 있던 DOM·pointer·requestAnimationFrame 제어 코드를
 * 한 글자도 바꾸지 않고 그대로 옮긴 모듈입니다. (DOM 을 직접 만지는 코드라 타입 검사는 끄고 둡니다.)
 * 사용: Home.componentDidMount() { startVillage.call(this); }  /  componentWillUnmount() { this.__w3off?.(); }
 */
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
  const frames = Array.prototype.slice.call(root.querySelectorAll(".ie-3fr"));
  const live = root.querySelector(".ie-w3live");
  const reduce = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // ── 마을을 여덟 방향에서 본 그림. 광장(분수)을 가운데 축으로 삼아 회전목마처럼 한 바퀴 돌아요.
  // 그림마다 광장 위치·크기를 맞춰 두었고(공통 좌표), 돌리는 동안 바닥을 광장 중심으로 같이 돌려서 이어 줘요.
  // e=이 그림이 가장 정확한 각도(°), src·ox·oy·w·h=그림 위치, q=섬 바닥 네 모서리, b=건물 10곳
  // 장소 순서(data-k): 학습 영역, 감정 읽기, 안전, 도움 구하기, 도움 받을 수 있는 곳, 이음상담소, 내 쪽지함, 알림, 내 학습 기록, 내 정보
  // b 각 칸: [말풍선 붙는 곳 x,y · 가까이 갈 때 가운데 x,y · 눌러서 고르는 영역 x0,y0,x1,y1]
  const RC = [1600, 1150],
    RX = 300,
    RY = 120,
    STEP = 45;
  const RING: any = [
    {
      e: 0,
      ox: 296.4,
      oy: 147.8,
      w: 2639,
      h: 1998,
      q: [
        [624, 786],
        [2565, 794],
        [2677, 1661],
        [543, 1661],
      ],
      b: [
        [1015, 693, 1015, 889, 852, 697, 1177, 1046],
        [1015, 693, 1015, 889, 852, 697, 1177, 1046],
        [2229, 693, 2229, 882, 2084, 697, 2375, 1034],
        [1921, 730, 1921, 887, 1759, 734, 2084, 1012],
        [2258, 1130, 2258, 1324, 2101, 1134, 2415, 1479],
        [1983, 1219, 1983, 1370, 1900, 1223, 2066, 1490],
        [2258, 1130, 2258, 1324, 2101, 1134, 2415, 1479],
        [1338, 579, 1338, 764, 1260, 583, 1416, 912],
        [979, 1159, 979, 1349, 819, 1163, 1139, 1501],
        [1303, 1190, 1303, 1357, 1184, 1194, 1423, 1490],
      ],
    },
    {
      e: 45,
      ox: 201.8,
      oy: 218.9,
      w: 2850,
      h: 2011,
      q: [
        [1873, 746],
        [2781, 1072],
        [2091, 1750],
        [436, 1234],
      ],
      b: [
        [1323, 653, 1323, 820, 1160, 657, 1486, 954],
        [1323, 653, 1323, 820, 1160, 657, 1486, 954],
        [2366, 868, 2366, 1049, 2200, 872, 2531, 1194],
        [2028, 813, 2028, 957, 1873, 817, 2183, 1072],
        [2015, 1208, 2015, 1386, 1806, 1212, 2224, 1528],
        [1148, 1164, 1148, 1305, 1022, 1168, 1273, 1417],
        [1692, 1235, 1692, 1398, 1588, 1239, 1796, 1528],
        [1622, 639, 1622, 775, 1540, 643, 1704, 883],
        [860, 950, 860, 1160, 664, 954, 1056, 1328],
        [860, 950, 860, 1160, 664, 954, 1056, 1328],
      ],
    },
    {
      e: 90,
      ox: 307.9,
      oy: 255.6,
      w: 2326,
      h: 1874,
      q: [
        [774, 951],
        [2388, 963],
        [2484, 1575],
        [612, 1575],
      ],
      b: [
        [1952, 760, 1952, 896, 1830, 764, 2074, 1004],
        [1952, 760, 1952, 896, 1830, 764, 2074, 1004],
        [2144, 1132, 2144, 1307, 2016, 1136, 2272, 1448],
        [1933, 1180, 1933, 1349, 1849, 1184, 2016, 1484],
        [1280, 1204, 1280, 1366, 1144, 1208, 1416, 1496],
        [1280, 1204, 1280, 1366, 1144, 1208, 1416, 1496],
        [1280, 1204, 1280, 1366, 1144, 1208, 1416, 1496],
        [952, 1000, 952, 1188, 865, 1004, 1040, 1340],
        [1371, 748, 1371, 890, 1237, 752, 1505, 1004],
        [1371, 748, 1371, 890, 1237, 752, 1505, 1004],
      ],
    },
    {
      e: 135,
      ox: 318.1,
      oy: 234.0,
      w: 2516,
      h: 1927,
      q: [
        [790, 929],
        [2443, 941],
        [2540, 1553],
        [624, 1553],
      ],
      b: [
        [2050, 654, 2050, 869, 1860, 658, 2240, 1042],
        [2050, 654, 2050, 869, 1860, 658, 2240, 1042],
        [2175, 1069, 2175, 1261, 2062, 1073, 2288, 1414],
        [1919, 1158, 1919, 1334, 1812, 1162, 2026, 1474],
        [1008, 1122, 1008, 1317, 871, 1126, 1145, 1474],
        [1332, 1218, 1332, 1380, 1210, 1222, 1455, 1510],
        [1008, 1122, 1008, 1317, 871, 1126, 1145, 1474],
        [1586, 637, 1586, 822, 1514, 641, 1657, 970],
        [1143, 798, 1143, 941, 1014, 802, 1271, 1054],
        [1143, 798, 1143, 941, 1014, 802, 1271, 1054],
      ],
    },
    {
      e: 180,
      ox: 270.4,
      oy: 95.4,
      w: 2633,
      h: 2219,
      q: [
        [766, 904],
        [2531, 919],
        [2663, 1576],
        [501, 1576],
      ],
      b: [
        [2258, 1052, 2258, 1298, 2096, 1056, 2421, 1495],
        [1931, 1103, 1931, 1320, 1832, 1107, 2030, 1495],
        [905, 1029, 905, 1259, 729, 1033, 1082, 1444],
        [1161, 1093, 1161, 1281, 1038, 1097, 1285, 1432],
        [1108, 717, 1108, 910, 932, 721, 1285, 1064],
        [1108, 717, 1108, 910, 932, 721, 1285, 1064],
        [1108, 717, 1108, 910, 932, 721, 1285, 1064],
        [1446, 636, 1446, 831, 1368, 640, 1523, 988],
        [2240, 743, 2240, 921, 2096, 747, 2383, 1064],
        [1886, 776, 1886, 922, 1759, 780, 2012, 1038],
      ],
    },
    {
      e: 225,
      ox: 332.4,
      oy: 234.0,
      w: 2492,
      h: 1903,
      q: [
        [805, 929],
        [2457, 941],
        [2555, 1553],
        [638, 1553],
      ],
      b: [
        [2133, 1014, 2133, 1249, 1981, 1018, 2286, 1438],
        [2133, 1014, 2133, 1249, 1981, 1018, 2286, 1438],
        [1011, 1134, 1011, 1310, 862, 1138, 1160, 1450],
        [1011, 1134, 1011, 1310, 862, 1138, 1160, 1450],
        [1115, 738, 1115, 881, 1024, 742, 1207, 994],
        [1115, 738, 1115, 881, 1024, 742, 1207, 994],
        [1115, 738, 1115, 881, 1024, 742, 1207, 994],
        [1608, 630, 1608, 819, 1540, 634, 1676, 970],
        [2002, 846, 2002, 949, 1862, 850, 2143, 1030],
        [2215, 1002, 2215, 1059, 2136, 1006, 2295, 1102],
      ],
    },
    {
      e: 270,
      ox: 320.5,
      oy: 253.2,
      w: 2519,
      h: 1870,
      q: [
        [793, 948],
        [2445, 960],
        [2543, 1572],
        [626, 1572],
      ],
      b: [
        [1052, 1081, 1052, 1290, 874, 1085, 1231, 1457],
        [1052, 1081, 1052, 1290, 874, 1085, 1231, 1457],
        [1160, 769, 1160, 932, 1029, 773, 1290, 1061],
        [1160, 769, 1160, 932, 1029, 773, 1290, 1061],
        [2050, 769, 2050, 932, 1917, 773, 2183, 1061],
        [2195, 1009, 2195, 1066, 2076, 1013, 2314, 1109],
        [2050, 769, 2050, 932, 1917, 773, 2183, 1061],
        [1600, 656, 1600, 835, 1529, 660, 1671, 977],
        [2163, 1021, 2163, 1256, 2012, 1025, 2314, 1445],
        [2163, 1021, 2163, 1256, 2012, 1025, 2314, 1445],
      ],
    },
    {
      e: 315,
      ox: 145.1,
      oy: 404.5,
      w: 2761,
      h: 1910,
      q: [
        [1598, 790],
        [2679, 1256],
        [1133, 1862],
        [400, 1142],
      ],
      b: [
        [900, 865, 900, 1064, 726, 869, 1074, 1224],
        [900, 865, 900, 1064, 726, 869, 1074, 1224],
        [1865, 807, 1865, 936, 1737, 811, 1993, 1038],
        [1865, 807, 1865, 936, 1737, 811, 1993, 1038],
        [2295, 1024, 2295, 1182, 2144, 1028, 2447, 1307],
        [2173, 1127, 2173, 1262, 2086, 1131, 2260, 1369],
        [2295, 1024, 2295, 1182, 2144, 1028, 2447, 1307],
        [1412, 755, 1412, 896, 1319, 759, 1505, 1007],
        [1255, 1210, 1255, 1419, 1040, 1214, 1470, 1587],
        [1662, 1278, 1662, 1427, 1528, 1282, 1795, 1545],
      ],
    },
  ];
  const NV = RING.length,
    NB = 10,
    NS = NB + 1;
  // 광장 중심으로 d도 돌리는 변환 [a,b,c,d,e,f]
  const rotM = (d) => {
    const r = (d * Math.PI) / 180,
      c = Math.cos(r),
      s = Math.sin(r);
    const a = c,
      b = (s * RY) / RX,
      cc = (-s * RX) / RY,
      dd = c;
    return [a, b, cc, dd, RC[0] - (a * RC[0] + cc * RC[1]), RC[1] - (b * RC[0] + dd * RC[1])];
  };
  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  RING.forEach((v, i) => {
    const el = frames[i];
    if (!el) return;
    el.style.width = v.w + "px";
    el.style.height = v.h + "px";
    // 돌리기 전에 미리 펼쳐 두어요(처음 돌릴 때 그림이 늦게 뜨지 않도록)
    try {
      if (el.decode) el.decode().catch(function () {});
    } catch (e) {}
  });

  const cur = { x: RC[0], y: 1180, z: 0.5 };
  const goal = { x: RC[0], y: 1180, z: 0.6 };
  let tp = 0,
    tt = 0; // 지금 보는 각도(°), 가려는 각도(°) — 360이면 한 바퀴
  let uz = 1,
    step = -1,
    W = 1,
    H = 1,
    padT = 62,
    padB = 16,
    raf = 0,
    last = 0,
    used = false,
    cy0 = 300;
  const lerp = (a, b, t) => a + (b - a) * t;
  // 지금 각도에서 이어 줄 두 그림
  const BL0 = { i: 0, j: 1, u: 0, di: 0, dj: -STEP };
  const blend = () => {
    // 회전·그림 전환 없음: 항상 정면(0°) 그림 하나만 써요
    return BL0;
  };
  const pt = (k, o, bl) => {
    const b1 = RING[bl.i].b[k],
      b2 = RING[bl.j].b[k];
    const p = ap(rotM(bl.di), b1[o], b1[o + 1]),
      q = ap(rotM(bl.dj), b2[o], b2[o + 1]);
    return [lerp(p[0], q[0], bl.u), lerp(p[1], q[1], bl.u)];
  };
  // 섬 전체가 차지하는 영역(지금 각도) — 돌 때 섬이 커져도 화면에 맞게 물러나요
  const bbox = (bl) => {
    const one = (fi, d) => {
      const m = rotM(d),
        xs = [],
        ys = [];
      RING[fi].q.forEach((c) => {
        const p = ap(m, c[0], c[1]);
        xs.push(p[0]);
        ys.push(p[1]);
      });
      const x0 = Math.min.apply(0, xs),
        x1 = Math.max.apply(0, xs),
        y0 = Math.min.apply(0, ys),
        y1 = Math.max.apply(0, ys),
        w = x1 - x0;
      return [(x0 + x1) / 2, w * 1.04, y0 - w * 0.11, y1 + w * 0.07];
    };
    const a = one(bl.i, bl.di),
      b = one(bl.j, bl.dj);
    const cx = lerp(a[0], b[0], bl.u),
      w = lerp(a[1], b[1], bl.u),
      t = lerp(a[2], b[2], bl.u),
      btm = lerp(a[3], b[3], bl.u);
    return { x: cx, y: (t + btm) / 2, w: w, h: btm - t };
  };
  const BASE = bbox({ i: 0, j: 1, u: 0, di: 0, dj: -STEP });
  // 마을 전체를 한 덩어리로 줄여서 여백을 둬요(건물 좌표·이름표 모두 같은 카메라 배율을 쓰므로 어긋나지 않아요).
  // 큰 화면은 약 82%, 작은 화면은 너무 작아지지 않게 92%까지.
  const fitOf = (b) => {
    const k = W < 720 ? 1.0 : 1.08;
    return Math.max(0.05, Math.min((W - 48) / b.w, (H - padT - padB) / b.h) * k);
  };
  const baseFit = () => fitOf(BASE);
  const rectSize = (k, bl) => {
    const fi = bl.u < 0.5 ? bl.i : bl.j,
      d = fi === bl.i ? bl.di : bl.dj,
      r = RING[fi].b[k],
      m = rotM(d);
    const ps = [ap(m, r[4], r[5]), ap(m, r[6], r[5]), ap(m, r[6], r[7]), ap(m, r[4], r[7])];
    const xs = ps.map((p) => p[0]),
      ys = ps.map((p) => p[1]);
    return [
      Math.max.apply(0, xs) - Math.min.apply(0, xs),
      Math.max.apply(0, ys) - Math.min.apply(0, ys),
    ];
  };
  const setGoal = () => {
    const bl = blend(),
      bb = bbox(bl),
      fz = fitOf(bb);
    if (step <= 0) {
      goal.x = bb.x;
      goal.y = bb.y;
      goal.z = fz;
      return;
    }
    const k = step - 1,
      f = pt(k, 2, bl),
      a = pt(k, 0, bl),
      rs = rectSize(k, bl);
    const zmax = (cy0 - 54) / Math.max(60, f[1] - a[1]);
    const zs = Math.min(
      (W * 0.48) / Math.max(rs[0], 80),
      ((H - padT - padB) * 0.62) / Math.max(rs[1], 80),
    );
    goal.x = f[0];
    goal.y = f[1];
    goal.z = Math.min(baseFit() * 4.6, zmax, zs);
  };
  const LW = [],
    LH = [];
  const CX = [0, -0.55, 0.55, -1.05, 1.05, -1.6, 1.6],
    CY = [0, -0.5, 0.5, -1, 1, 1.5, -2, 2];
  let small = null;
  const LS = []; // 이름표별 상태: 목표 offset(ox,oy), 화면에 보이는 offset(sx,sy), 숨김 여부
  let ldt = 0.016,
    labBusy = false,
    labSnap = true,
    wheelUntil = 0; // 휠을 돌리는 중이면 각도를 더 빠르게 따라가요
  const draw = () => {
    const z = cur.z * uz;
    const cam = [z, 0, 0, z, W / 2 - cur.x * z, cy0 - cur.y * z];
    const bl = blend();
    for (let i = 0; i < NV; i++) {
      const el = frames[i];
      const o = i === bl.i ? 1 - Math.max(0, 2 * bl.u - 1) : i === bl.j ? bl.u : 0;
      if (o <= 0) {
        el.style.visibility = "hidden";
        continue;
      }
      const v = RING[i],
        d = i === bl.i ? bl.di : bl.dj;
      const m = mul(cam, mul(rotM(d), [1, 0, 0, 1, v.ox, v.oy]));
      el.style.transform = "matrix(" + m.map((n) => n.toFixed(5)).join(",") + ")";
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = i === bl.i ? 1 : 2;
      el.style.visibility = "visible";
    }
    const sm = z < baseFit() * 0.8;
    if (sm !== small) {
      small = sm;
      root.classList.toggle("is-small", sm);
      for (let k = 0; k < labs.length; k++) LW[k] = 0;
    }
    // ── 이름표: 건물 위치(앵커)는 매 프레임 그대로 따라가고, 겹침 회피용 '밀어낸 정도'(offset)만
    // 이전 값을 유지하며 부드럽게 보간해요. 숨김은 화면 밖으로 완전히 나갔을 때만(여유 + 히스테리시스).
    const P: any[] = [];
    for (let k = 0; k < NB; k++) {
      const a = pt(k, 0, bl);
      const px = W / 2 + (a[0] - cur.x) * z,
        py = cy0 + (a[1] - cur.y) * z;
      if (!LW[k]) {
        LW[k] = labs[k].offsetWidth || 120;
        LH[k] = labs[k].offsetHeight || 40;
      }
      const ls = LS[k] || (LS[k] = { ox: 0, oy: 0, sx: 0, sy: 0, gone: true });
      const w = LW[k],
        h = LH[k] + 8,
        m = ls.gone ? -30 : 30; // 이미 보이는 표는 더 멀리 나가야 숨김(깜빡임 방지)
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
    // 선택된 표 먼저, 그다음 앞(아래쪽) 표가 우선. 정렬 기준은 안정적인 앵커 y
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
          if (
            Math.abs(x - b.tx) < (a.w + b.w) / 2 + 6 + pad &&
            Math.abs(y - b.ty) < (a.h + b.h) / 2 + pad
          )
            return false;
        }
        return true;
      };
      let ox = ls.ox,
        oy = ls.oy,
        ok = false;
      if (a.fix) {
        ok = true; // 선택된 표는 자리를 양보하지 않아요
        ox = 0;
        oy = 0;
      } else if ((ox !== 0 || oy !== 0) && free(0, 0, 14)) {
        ox = 0; // 자리가 넉넉히 비면 원래 자리로 돌아와요
        oy = 0;
        ok = true;
      } else if (free(ox, oy, 0)) ok = true; // 이전 자리가 아직 괜찮으면 그대로 유지
      if (!ok) {
        let bd = 1e9;
        for (let ix = 0; ix < CX.length; ix++)
          for (let iy = 0; iy < CY.length; iy++) {
            const cx = CX[ix] * a.w,
              cy = CY[iy] * a.h,
              d =
                Math.abs(cx - ls.ox) +
                Math.abs(cy - ls.oy) * 1.2 + // 이전 자리에 가까운 곳 우선
                (Math.abs(cx) + Math.abs(cy)) * 0.3;
            if (d < bd && free(cx, cy, 0)) {
              bd = d;
              ox = cx;
              oy = cy;
              ok = true;
            }
          }
      }
      // 빈 곳이 없으면 숨기지 않고 이전 자리에 둬요(잠깐 겹쳐도 깜빡이는 것보다 나아요)
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
        // 숨겨진 동안에도 위치는 앵커를 따라가게 해 둬요
        a.tx = a.ax;
        a.ty = a.ay;
        ls.ox = 0;
        ls.oy = 0;
        ls.sx = 0;
        ls.sy = 0;
      } else {
        if (ls.gone) {
          ls.gone = false;
          ls.sx = ls.ox; // 다시 나타날 땐 제자리에서 바로 나타나요
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
        "translate3d(" +
        (a.ax + ls.sx).toFixed(1) +
        "px," +
        (a.ay + ls.sy).toFixed(1) +
        "px,0) translate(-50%,-100%)";
    }
    labBusy = busy;
    labSnap = false;
  };
  const wake = () => {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const tick = (t) => {
    raf = 0;
    const dt = Math.min(0.25, last ? (t - last) / 1000 : 0.016);
    last = t;
    ldt = dt;
    const wheeling = t < wheelUntil;
    // 카메라(위치·확대)와 회전이 비슷한 속도로 따라가 한 덩어리처럼 움직이게 해요
    const f = reduce ? 1 : 1 - Math.exp(-dt * (wheeling ? 7 : 5));
    const fr = reduce ? 1 : 1 - Math.exp(-dt * (down ? 14 : wheeling ? 7 : 5));
    tp += (tt - tp) * fr;
    setGoal();
    cur.x += (goal.x - cur.x) * f;
    cur.y += (goal.y - cur.y) * f;
    cur.z += (goal.z - cur.z) * f;
    draw();
    const still =
      Math.abs(goal.x - cur.x) < 0.3 &&
      Math.abs(goal.y - cur.y) < 0.3 &&
      Math.abs(goal.z - cur.z) < 0.0006 &&
      Math.abs(tt - tp) < 0.03;
    if (!still || labBusy) raf = requestAnimationFrame(tick);
    else {
      setGoal();
      cur.x = goal.x;
      cur.y = goal.y;
      cur.z = goal.z;
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
    live.textContent =
      it.querySelector(".ie-w3nm").textContent + ". " + it.querySelector(".ie-w3ds").textContent;
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
    padB = 16;
    padT = 56;
    cy0 = padT + (H - padT - padB) / 2;
    for (let k = 0; k < labs.length; k++) LW[k] = 0;
    setGoal();
    if (!raf) {
      cur.x = goal.x;
      cur.y = goal.y;
      cur.z = goal.z;
      draw();
    }
  };

  // ── 입력: 휠(카드 전체) · 끌어서 돌리기 · 클릭 · 키 · 점 · 좌우 버튼
  let wAcc = 0,
    wLast = 0,
    wGo = 0;
  root.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        zoomBy(Math.exp(-e.deltaY * 0.012));
        markUsed();
        return;
      }
      // 휠(픽셀/줄 단위)·트랙패드 모두 누적해서, 일정량 넘으면 다음/이전 건물로 스냅(카메라가 부드럽게 다가가요)
      let d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= H;
      const now = performance.now();
      if (now - wLast > 250) wAcc = 0;
      wLast = now;
      wAcc += Math.max(-150, Math.min(150, d));
      if (Math.abs(wAcc) >= 30 && now - wGo > 380) {
        wGo = now;
        setStep(step + (wAcc > 0 ? 1 : -1));
        wAcc = 0;
        markUsed();
      }
    },
    { passive: false },
  );
  let down = false,
    drag = false,
    sx = 0,
    startT = 0,
    vel = 0,
    lx = 0,
    lt = 0;
  const DPX = 0; // 나중에 0.36으로 변경. 한 번 끌 때 도는 각도(° / px): 화면 가로로 한 바퀴쯤
  // 화면 좌표 → 공통 좌표 → 어느 건물인지(지금 더 또렷한 그림 기준)
  const pick = (e) => {
    const r = st.getBoundingClientRect();
    const z = cur.z * uz;
    // 앱 전체에 CSS zoom 이 걸려 있으면 화면 좌표와 요소 내부 좌표의 비율이 달라서 보정해요
    const sc = r.width / (st.offsetWidth || r.width) || 1;
    const gx = (e.clientX - r.left) / sc - W / 2;
    const gy = (e.clientY - r.top) / sc - cy0;
    const gx2 = gx / z + cur.x,
      gy2 = gy / z + cur.y;
    const bl = blend(),
      fi = bl.u < 0.5 ? bl.i : bl.j,
      d = fi === bl.i ? bl.di : bl.dj;
    const q = ap(rotM(-d), gx2, gy2);
    for (let k = 0; k < NB; k++) {
      const h = RING[fi].b[k];
      if (q[0] >= h[4] && q[0] <= h[6] && q[1] >= h[5] && q[1] <= h[7]) return k;
    }
    return -1;
  };
  st.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest(".ie-3lab,.ie-3zoom")) return;
    down = true;
    drag = false;
    sx = e.clientX;
    startT = tt;
    vel = 0;
    lx = e.clientX;
    lt = performance.now();
  });
  window.addEventListener("pointermove", (e) => {
    if (down) {
      const mv = Math.abs(e.clientX - sx);
      if (!drag && mv > 6) {
        drag = true;
        st.classList.add("is-drag");
        markUsed();
      }
      if (drag) {
        tt = startT; // 회전 없음
        const now = performance.now(),
          dtm = Math.max(1, now - lt);
        vel = vel * 0.6 + (((lx - e.clientX) * DPX) / dtm) * 1000 * 0.4;
        lx = e.clientX;
        lt = now;
        wake();
      }
    } else if (
      st.contains(e.target) &&
      !(e.target.closest && e.target.closest(".ie-3lab,.ie-3zoom"))
    ) {
      st.classList.toggle("is-hot", pick(e) >= 0);
    }
  });
  const snap = (a) => Math.round(a / STEP) * STEP;
  const settle = () => {
    tt = snap(tt + Math.max(-90, Math.min(90, vel * 0.22)));
    wake();
  };
  const up = (e) => {
    if (!down) return;
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
  window.addEventListener("pointercancel", () => {
    if (down && drag) {
      down = false;
      drag = false;
      st.classList.remove("is-drag");
      settle();
    } else {
      down = false;
      drag = false;
      st.classList.remove("is-drag");
    }
  });
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
    if (ro) ro.disconnect();
    window.removeEventListener("resize", fit);
    window.removeEventListener("pointerup", up);
    if (raf) cancelAnimationFrame(raf);
  };
  tp = tt = 0; // 처음엔 정면에서 본 그림
  fit();
  setStep(0);
  if (!reduce) {
    cur.z = goal.z * 0.85;
    cur.y = goal.y + 40;
    wake();
  } else {
    Object.assign(cur, goal);
    draw();
  }
  window.__w3dbg = {
    get tp() {
      return tp;
    },
    set tt(v) {
      tt = v;
      wake();
    },
    get tt() {
      return tt;
    },
  };
}
