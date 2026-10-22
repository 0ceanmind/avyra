// Procedural A320neo-class airliner, built from real proportions (metres):
// length 37.6, fuselage Ø 3.96, span ≈ 35.8 with sharklets, height ≈ 11.7.
// Model space: nose at x = 0, tail at x = +L, y up, right wing toward +z.
import * as THREE from 'three';

export const L = 37.6;
export const R = 1.98;
export const GROUND_Y = -R - 2.1;
const TN = 0.13; // nose section end (fraction of length)
const TT = 0.66; // tail cone start

const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;

export function fusR(t) {
  if (t < TN) { const s = t / TN; return R * Math.sqrt(Math.max(0, 1 - Math.pow(1 - s, 2.4))); }
  if (t <= TT) return R;
  const s = (t - TT) / (1 - TT);
  return R * (1 - Math.pow(s, 1.6) * 0.94);
}
export function fusCY(t) {
  if (t < TN) { const s = t / TN; return -0.2 * R * Math.pow(1 - s, 2); }
  if (t <= TT) return 0;
  return (R - fusR(t)) * 0.9;
}

// ── Shared shader patch: scan band + "digital twin" hologram blend ───────────
export function createFx() {
  return {
    uScan: { value: -100 },
    uScanOn: { value: 0 },
    uHolo: { value: 0 },
    uInvModel: { value: new THREE.Matrix4() },
  };
}
function patch(mat, fx) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, fx);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uInvModel;\nvarying vec3 vLocal;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLocal = (uInvModel * modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uScan;\nuniform float uScanOn;\nuniform float uHolo;\nvarying vec3 vLocal;')
      .replace(
        '#include <dithering_fragment>',
        `{
          vec3 cy = vec3(0.23, 0.85, 0.97);
          float d = vLocal.x - uScan;
          float band = exp(-d * d * 0.5) * uScanOn;
          float trail = (d < 0.0 ? exp(d * 0.22) : 0.0) * uScanOn;
          vec3 vd = normalize(vViewPosition);
          float fr = pow(1.0 - clamp(abs(dot(normalize(normal), vd)), 0.0, 1.0), 2.0);
          float gl = pow(abs(sin(vLocal.x * 1.5708)), 90.0) + 0.6 * pow(abs(sin(vLocal.y * 3.1416)), 90.0);
          vec3 holo = vec3(0.012, 0.03, 0.07) + cy * (fr * 1.35 + gl * 0.28);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, holo, uHolo);
          gl_FragColor.rgb += cy * (band * 1.4 + trail * 0.18 * (1.0 - uHolo * 0.5));
        }
        #include <dithering_fragment>`
      );
  };
  mat.customProgramCacheKey = () => 'avyra-fx';
  return mat;
}

// ── Fuselage: analytic tube with smooth normals + painted livery UVs ─────────
function fuselageGeometry() {
  const NS = 220, NR = 72;
  const pos = [], nor = [], uv = [], idx = [];
  const h = 1e-4;
  for (let i = 0; i <= NS; i++) {
    const t = i / NS;
    const r = fusR(t), cy = fusCY(t);
    const t0 = Math.max(0, t - h), t1 = Math.min(1, t + h);
    const dr = (fusR(t1) - fusR(t0)) / ((t1 - t0) * L);
    const dcy = (fusCY(t1) - fusCY(t0)) / ((t1 - t0) * L);
    for (let j = 0; j <= NR; j++) {
      const th = (j / NR) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      pos.push(t * L, cy + r * c, r * s);
      const n = new THREE.Vector3(-(dr + c * dcy), c, s).normalize();
      nor.push(n.x, n.y, n.z);
      uv.push(t, j / NR);
    }
  }
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NR; j++) {
      const a = i * (NR + 1) + j, b = a + NR + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function paintFuselage(maxAniso) {
  const W = 4096, H = 1366;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const U = (x) => (x / L) * W; // metres along fuselage → px
  const V = (v) => v * H;

  // Base paint + belly
  g.fillStyle = '#f3f5f8';
  g.fillRect(0, 0, W, H);
  const belly = g.createLinearGradient(0, V(0.36), 0, V(0.64));
  belly.addColorStop(0, 'rgba(196,203,213,0)');
  belly.addColorStop(0.18, '#c4cbd5');
  belly.addColorStop(0.82, '#c4cbd5');
  belly.addColorStop(1, 'rgba(196,203,213,0)');
  g.fillStyle = belly;
  g.fillRect(0, V(0.36), W, V(0.28));

  // Brand swoosh — three waves sweeping up toward the tail (mirrored per side).
  const waves = (side) => {
    const m = side > 0 ? (v) => v : (v) => 1 - v; // -z side mirrors vertically
    const cols = [['#1f5fe0', '#19c6f0', '#7fd94a'], ['#1846c8', '#21b5ef', '#5fd0b8'], ['#0d2f8f', '#1e8fe6', '#3bc4d8']];
    [[0, 34], [1, 22], [2, 14]].forEach(([k, w], n) => {
      const gr = g.createLinearGradient(U(14), 0, U(37), 0);
      gr.addColorStop(0, cols[k][0]); gr.addColorStop(0.55, cols[k][1]); gr.addColorStop(1, cols[k][2]);
      g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'round';
      const o = n * 0.032;
      g.beginPath();
      g.moveTo(U(13 + n * 1.5), V(m(0.33 + o)));
      g.bezierCurveTo(U(22), V(m(0.36 + o)), U(28), V(m(0.24 + o)), U(37.4), V(m(0.075 + o * 0.6)));
      g.stroke();
    });
  };
  waves(1); waves(-1);

  // Windows, doors, cockpit
  const winV = [0.25 - 0.32 / (Math.PI * 2), 0.75 + 0.32 / (Math.PI * 2)];
  g.fillStyle = '#18202c';
  for (const v of winV) {
    for (let x = 6.4; x < 30.4; x += 0.535) {
      if ((x > 15.0 && x < 16.9)) continue;
      const w = 0.25 * (W / L), hh = 0.34 * (W / L);
      roundRect(g, U(x) - w / 2, V(v) - hh / 2, w, hh, 9);
      g.fill();
    }
  }
  g.strokeStyle = 'rgba(80,90,105,0.55)'; g.lineWidth = 3;
  const door = (x, v, w, h) => { roundRect(g, U(x) - (w * W) / L / 2, V(v) - (h * W) / L / 2, (w * W) / L, (h * W) / L, 12); g.stroke(); };
  for (const v of winV) {
    const s = v < 0.5 ? 1 : -1;
    door(4.9, v + s * 0.012, 0.82, 1.85);
    door(15.4, v + s * 0.004, 0.52, 1.0);
    door(16.4, v + s * 0.004, 0.52, 1.0);
    door(31.2, v + s * 0.012, 0.82, 1.85);
  }
  // Cockpit glazing
  const glass = g.createLinearGradient(0, V(0.1), 0, V(0.21));
  glass.addColorStop(0, '#2a3a52');
  glass.addColorStop(1, '#0c121c');
  const poly = (pts, m) => {
    g.beginPath();
    pts.forEach(([x, v], i) => (i ? g.lineTo(U(x), V(m(v))) : g.moveTo(U(x), V(m(v)))));
    g.closePath();
    g.fill();
  };
  for (const side of [1, -1]) {
    const m = side > 0 ? (v) => v : (v) => 1 - v;
    g.fillStyle = side > 0 ? glass : '#111a27';
    poly([[1.98, 0.196], [2.3, 0.128], [2.78, 0.118], [2.78, 0.19]], m);
    poly([[2.88, 0.118], [3.38, 0.124], [3.38, 0.186], [2.88, 0.19]], m);
    // front windshield panes either side of the crown seam
    g.fillStyle = '#111a27';
    poly([[1.7, 0.006], [2.22, 0.006], [2.2, 0.07], [1.86, 0.1]], m);
  }

  // Titles: "AVYRA" reads left→right on both sides (−z side drawn rotated 180°).
  const title = (cx, cy, rot, size, text, spacing, color, weight = 300) => {
    g.save();
    g.translate(cx, cy); g.rotate(rot);
    g.font = `${weight} ${size}px "Inter Variable", "Inter", sans-serif`;
    g.fillStyle = color; g.textBaseline = 'middle';
    const widths = [...text].map((ch) => g.measureText(ch).width);
    const tw = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    let x = -tw / 2;
    [...text].forEach((ch, i) => { g.fillText(ch, x, 0); x += widths[i] + spacing; });
    g.restore();
  };
  const tv = 0.25 - 0.78 / (Math.PI * 2);
  title(U(12.5), V(tv), 0, 150, 'AVYRA', 70, '#0f2552');
  title(U(12.5), V(1 - tv), Math.PI, 150, 'AVYRA', 70, '#0f2552');
  const rv = 0.25 - 0.1 / (Math.PI * 2);
  title(U(33.4), V(rv), 0, 44, 'A4O-AVY', 8, '#2a3446', 500);
  title(U(33.4), V(1 - rv), Math.PI, 44, 'A4O-AVY', 8, '#2a3446', 500);

  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ── Lifting surfaces: lofted NACA sections ───────────────────────────────────
function airfoil(n = 26) {
  const up = [], lo = [];
  const m = 0.022, p = 0.4;
  for (let i = 0; i <= n; i++) {
    const b = (i / n) * Math.PI;
    const x = (1 - Math.cos(b)) / 2;
    const yt = 5 * 0.12 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    let yc, dy;
    if (x < p) { yc = (m / (p * p)) * (2 * p * x - x * x); dy = ((2 * m) / (p * p)) * (p - x); }
    else { yc = (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x); dy = ((2 * m) / (1 - p) ** 2) * (p - x); }
    const th = Math.atan(dy);
    up.push({ x: x - yt * Math.sin(th), y: yc + yt * Math.cos(th), c: x, s: 0, yt, yc });
    lo.push({ x: x + yt * Math.sin(th), y: yc - yt * Math.cos(th), c: x, s: 1, yt, yc });
  }
  const pts = [];
  for (let i = n; i >= 0; i--) pts.push(up[i]);
  for (let i = 1; i < n; i++) pts.push(lo[i]);
  return pts;
}
const AF = airfoil();

function loft(sections, { cap = true, symmetric = false } = {}) {
  const M = AF.length;
  const pos = [], uv = [], idx = [];
  sections.forEach((s, k) => {
    const sc = s.thick / 0.12;
    for (let j = 0; j < M; j++) {
      const p = AF[j];
      // symmetric sections (fin) drop camber
      const y = symmetric ? (p.s === 0 ? p.yt : -p.yt) : p.yc + (p.y - p.yc) * sc;
      const P = s.le.clone().addScaledVector(s.X, p.x * s.chord).addScaledVector(s.N, y * s.chord);
      pos.push(P.x, P.y, P.z);
      uv.push(p.s === 0 ? 0.5 * (1 - p.c) : 0.5 + 0.5 * p.c, k / (sections.length - 1));
    }
  });
  const K = sections.length;
  const span = sections[1].le.clone().sub(sections[0].le).normalize();
  const flip = new THREE.Vector3().crossVectors(sections[0].X.clone().negate(), span).dot(sections[0].N) < 0;
  for (let k = 0; k < K - 1; k++) {
    for (let j = 0; j < M; j++) {
      const a = k * M + j, b = k * M + ((j + 1) % M), c = (k + 1) * M + j, d = (k + 1) * M + ((j + 1) % M);
      if (!flip) idx.push(a, b, c, b, d, c);
      else idx.push(a, c, b, b, c, d);
    }
  }
  if (cap) {
    const base = (K - 1) * M;
    const cen = new THREE.Vector3();
    for (let j = 0; j < M; j++) cen.add(new THREE.Vector3(pos[(base + j) * 3], pos[(base + j) * 3 + 1], pos[(base + j) * 3 + 2]));
    cen.divideScalar(M);
    const ci = pos.length / 3;
    pos.push(cen.x, cen.y, cen.z);
    uv.push(0.5, 1);
    const lastSpan = sections[K - 1].le.clone().sub(sections[K - 2].le).normalize();
    const A = new THREE.Vector3(pos[base * 3], pos[base * 3 + 1], pos[base * 3 + 2]);
    const B = new THREE.Vector3(pos[(base + 1) * 3], pos[(base + 1) * 3 + 1], pos[(base + 1) * 3 + 2]);
    const nrm = new THREE.Vector3().crossVectors(B.clone().sub(A), cen.clone().sub(A));
    const ok = nrm.dot(lastSpan) > 0;
    for (let j = 0; j < M; j++) {
      const a = base + j, b = base + ((j + 1) % M);
      ok ? idx.push(a, b, ci) : idx.push(b, a, ci);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mirrorZ(geo) {
  const g = geo.clone();
  g.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
  const ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  g.index.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function wingSections() {
  const secs = [];
  const zs = [0.4, 2.0, 4.0, 6.3, 9.0, 12.0, 14.6, 16.9];
  const sweep = Math.tan(27 * D2R), dih = Math.tan(5.5 * D2R);
  for (const z of zs) {
    const s = z - 0.4;
    const chord = z <= 6.3 ? lerp(7.2, 4.1, (z - 0.4) / 5.9) : lerp(4.1, 1.55, (z - 6.3) / 10.6);
    const tr = z <= 6.3 ? lerp(0.15, 0.12, (z - 0.4) / 5.9) : lerp(0.12, 0.1, (z - 6.3) / 10.6);
    secs.push({ le: new THREE.Vector3(13.2 + s * sweep, -1.15 + s * dih, z), chord, thick: tr, X, N: Y.clone() });
  }
  // Sharklet: blend the section up and inboard-facing
  const tip = secs[secs.length - 1].le;
  const shark = [
    [0.32, 0.26, 0.38, 1.36, 0.35],
    [0.5, 0.86, 0.8, 1.08, 0.75],
    [0.58, 1.75, 1.32, 0.8, 0.96],
    [0.6, 2.45, 1.78, 0.55, 1.0],
  ];
  for (const [dz, dy, dx, chord, a] of shark) {
    const N = Y.clone().lerp(Z.clone().negate(), a).normalize();
    secs.push({ le: new THREE.Vector3(tip.x + dx, tip.y + dy, tip.z + dz), chord, thick: 0.09, X, N });
  }
  return secs;
}
function stabSections() {
  const secs = [];
  const sweep = Math.tan(32 * D2R), dih = Math.tan(6 * D2R);
  for (const z of [0.3, 3.3, 6.25]) {
    const s = z - 0.3;
    secs.push({ le: new THREE.Vector3(30.6 + s * sweep, 0.55 + s * dih, z), chord: lerp(4.0, 1.5, s / 5.95), thick: 0.1, X, N: Y.clone() });
  }
  return secs;
}
function finSections() {
  const secs = [];
  const sweep = Math.tan(38 * D2R);
  for (const t of [0, 0.35, 0.7, 1]) {
    const h = 6.4 * t;
    secs.push({ le: new THREE.Vector3(27.6 + h * sweep, 1.2 + h, 0), chord: lerp(6.4, 2.6, t), thick: 0.11, X, N: Z.clone() });
  }
  return secs;
}

function paintFin(maxAniso, logoUrl) {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  // canvas x = chord param (0..0.5 = +z side, TE→LE; 0.5..1 = −z side, LE→TE); y = span (root→tip)
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#0a1838');
  base.addColorStop(1, '#0e2a66');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const wave = (x0, x1) => {
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, '#19c6f0'); gr.addColorStop(0.5, '#1f5fe0'); gr.addColorStop(1, '#7fd94a');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x0, H * 0.0);
    g.bezierCurveTo(x0 + (x1 - x0) * 0.3, H * 0.18, x0 + (x1 - x0) * 0.6, H * 0.05, x1, H * 0.22);
    g.lineTo(x1, 0); g.closePath();
    g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
  };
  wave(0, W / 2); wave(W, W / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  const img = new Image();
  img.onload = () => {
    // Both halves appear rotated 180° on screen → draw the badge rotated.
    for (const cx of [W * 0.27, W * 0.73]) {
      g.save();
      g.translate(cx, H * 0.56);
      g.rotate(Math.PI);
      const s = 300;
      g.drawImage(img, -s / 2, -s / 2, s, s);
      g.restore();
    }
    tex.needsUpdate = true;
  };
  img.src = logoUrl;
  return tex;
}

// ── Engine nacelle ───────────────────────────────────────────────────────────
function buildEngine(mats) {
  const grp = new THREE.Group();
  const v = (r, h) => new THREE.Vector2(r, h);
  const shell = new THREE.LatheGeometry(
    [v(0.86, 0.7), v(0.89, 0.32), v(0.93, 0.06), v(0.99, 0.0), v(1.05, 0.05), v(1.1, 0.34), v(1.13, 1.2), v(1.1, 2.3), v(1.0, 3.2), v(0.9, 3.7), v(0.82, 3.72)],
    56
  );
  shell.rotateZ(-Math.PI / 2);
  grp.add(new THREE.Mesh(shell, mats.nacelle));

  const core = new THREE.LatheGeometry(
    [v(0.0, 0.3), v(0.18, 0.4), v(0.32, 0.58), v(0.42, 0.78), v(0.62, 1.2), v(0.68, 3.7), v(0.6, 4.4), v(0.44, 4.9), v(0.28, 5.25), v(0.12, 5.55), v(0.0, 5.7)],
    48
  );
  core.rotateZ(-Math.PI / 2);
  grp.add(new THREE.Mesh(core, mats.core));

  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.045, 12, 64), mats.chrome);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = 0.02;
  grp.add(lip);

  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.87, 48), mats.dark);
  disc.rotation.y = -Math.PI / 2;
  disc.position.x = 0.78;
  grp.add(disc);

  const fan = new THREE.Group();
  fan.position.x = 0.66;
  const blade = new THREE.BoxGeometry(0.05, 0.5, 0.2);
  blade.translate(0, 0.6, 0);
  const blades = new THREE.InstancedMesh(blade, mats.blade, 18);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 18; i++) {
    e.set((i / 18) * Math.PI * 2, 0.55, 0, 'XYZ');
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(), q, new THREE.Vector3(1, 1, 1));
    blades.setMatrixAt(i, m);
  }
  fan.add(blades);
  const spin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 32), mats.spinner);
  spin.rotation.z = Math.PI / 2;
  spin.position.x = -0.05;
  fan.add(spin);
  grp.add(fan);
  return { grp, fan };
}

// ── Landing gear ─────────────────────────────────────────────────────────────
function buildGear(mats) {
  const gear = new THREE.Group();
  const cyl = (r, h) => new THREE.CylinderGeometry(r, r, h, 16);
  const wheel = (r, w) => { const gg = new THREE.CylinderGeometry(r, r, w, 28); gg.rotateX(Math.PI / 2); return gg; };
  const hub = (r, w) => { const gg = new THREE.CylinderGeometry(r * 0.55, r * 0.55, w * 1.02, 20); gg.rotateX(Math.PI / 2); return gg; };
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    const z = 3.85 * side;
    const strut = new THREE.Mesh(cyl(0.13, 2.7), mats.strut);
    strut.position.set(17.9, -2.2, z);
    leg.add(strut);
    const brace = new THREE.Mesh(cyl(0.05, 2.2), mats.strut);
    brace.position.set(17.9, -2.0, z - side * 0.7);
    brace.rotation.x = side * 0.62;
    leg.add(brace);
    for (const dz of [0.4, -0.4]) {
      const w = new THREE.Mesh(wheel(0.58, 0.36), mats.tire);
      w.position.set(17.9, GROUND_Y + 0.58, z + dz);
      leg.add(w);
      const hb = new THREE.Mesh(hub(0.58, 0.36), mats.chrome);
      hb.position.copy(w.position);
      leg.add(hb);
    }
    gear.add(leg);
  }
  const nose = new THREE.Group();
  const ns = new THREE.Mesh(cyl(0.1, 2.0), mats.strut);
  ns.position.set(5.3, -2.65, 0);
  nose.add(ns);
  for (const dz of [0.26, -0.26]) {
    const w = new THREE.Mesh(wheel(0.38, 0.24), mats.tire);
    w.position.set(5.3, GROUND_Y + 0.38, dz);
    nose.add(w);
    const hb = new THREE.Mesh(hub(0.38, 0.24), mats.chrome);
    hb.position.copy(w.position);
    nose.add(hb);
  }
  gear.add(nose);
  return gear;
}

// ── Assembly ─────────────────────────────────────────────────────────────────
export function buildAircraft(renderer, { logoUrl }) {
  const fx = createFx();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const P = (o) => patch(new THREE.MeshPhysicalMaterial(o), fx);
  const mats = {
    body: P({ map: paintFuselage(aniso), roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    wing: P({ color: 0xc9d0d9, roughness: 0.42, metalness: 0.35, clearcoat: 0.3 }),
    fin: P({ map: paintFin(aniso, logoUrl), roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.15, side: THREE.DoubleSide }),
    nacelle: P({ color: 0x0d1d42, roughness: 0.28, metalness: 0.45, clearcoat: 0.9, clearcoatRoughness: 0.12, side: THREE.DoubleSide }),
    core: P({ color: 0x8a929e, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }),
    chrome: P({ color: 0xe6ebf1, roughness: 0.12, metalness: 1.0 }),
    dark: P({ color: 0x0b0e14, roughness: 0.6, metalness: 0.4 }),
    blade: P({ color: 0x3a414c, roughness: 0.3, metalness: 0.9 }),
    spinner: P({ color: 0xdfe5ec, roughness: 0.2, metalness: 0.6 }),
    strut: P({ color: 0x9aa3ae, roughness: 0.3, metalness: 0.9 }),
    tire: P({ color: 0x111317, roughness: 0.85, metalness: 0.0 }),
    pylon: P({ color: 0xd8dee6, roughness: 0.4, metalness: 0.3 }),
  };

  const model = new THREE.Group();
  model.add(new THREE.Mesh(fuselageGeometry(), mats.body));

  const wingR = loft(wingSections());
  model.add(new THREE.Mesh(wingR, mats.wing));
  model.add(new THREE.Mesh(mirrorZ(wingR), mats.wing));
  const stab = loft(stabSections());
  model.add(new THREE.Mesh(stab, mats.wing));
  model.add(new THREE.Mesh(mirrorZ(stab), mats.wing));
  model.add(new THREE.Mesh(loft(finSections(), { symmetric: true }), mats.fin));

  // Wing-body fairing (belly pod)
  const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), P({ color: 0xe9edf2, roughness: 0.35, metalness: 0.05, clearcoat: 0.5 }));
  fair.scale.set(7.2, 0.95, 2.15);
  fair.position.set(16.6, -1.15, 0);
  model.add(fair);

  const fans = [];
  const engines = {};
  for (const side of [1, -1]) {
    const z = 5.7 * side;
    const { grp, fan } = buildEngine(mats);
    grp.position.set(13.5, -1.99, z);
    model.add(grp);
    fans.push(fan);
    engines[side > 0 ? 'right' : 'left'] = grp;
    const py = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.75, 0.38), mats.pylon);
    py.position.set(16.4, -0.95, z);
    py.rotation.z = 0.05;
    model.add(py);
  }

  const gear = buildGear(mats);
  model.add(gear);

  model.position.x = -18.4; // centre roughly at the wing
  const root = new THREE.Group();
  root.add(model);

  // Ground: soft "digital apron" grid + contact shadow
  const groundMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0x3ad8f7) } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uOpacity; uniform vec3 uColor; varying vec2 vP;
      float grid(vec2 p, float s){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y), 1.0); }
      void main(){
        float d = length(vP) / 62.0;
        float fade = smoothstep(1.0, 0.1, d);
        float a = (grid(vP, 2.0) * 0.07 + grid(vP, 10.0) * 0.18) * fade;
        float sh = smoothstep(1.0, 0.0, length(vec2(vP.x / 21.0, vP.y / 19.0)));
        vec3 col = mix(uColor, vec3(0.0), sh);
        gl_FragColor = vec4(col, max(a, sh * 0.6) * uOpacity);
      }`,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.renderOrder = -1;

  // Points of interest in model space (for HTML markers).
  const points = {
    engine: new THREE.Vector3(14.6, -1.0, 5.7),
    gear: new THREE.Vector3(17.9, -3.45, 4.25),
    nose: new THREE.Vector3(1.0, 0, 0),
  };

  return { root, model, fans, gear, ground, fx, points, mats, engines };
}
