import { gsap } from 'gsap';

export const BASE = import.meta.env.BASE_URL;
export const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

// Tween the number shown in an element. Keeps its own state so it is interruptible.
export function tweenNum(el, to, { duration = 1.2, ease = 'power3.out', format = (v) => fmt(Math.round(v)), onUpdate } = {}) {
  if (!el._n) el._n = { v: 0 };
  gsap.killTweensOf(el._n);
  return gsap.to(el._n, {
    v: to, duration, ease,
    onUpdate() { el.textContent = format(el._n.v); onUpdate?.(el._n.v); },
  });
}
export function setNum(el, v, format = (x) => fmt(Math.round(x))) {
  if (!el._n) el._n = { v: 0 };
  gsap.killTweensOf(el._n);
  el._n.v = v;
  el.textContent = format(v);
}

export function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Smooth SVG path through points (Catmull–Rom → cubic Bézier).
export function smoothPath(pts, k = 0.5) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k * 2, p1[1] + ((p2[1] - p0[1]) / 6) * k * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k * 2, p2[1] - ((p3[1] - p1[1]) / 6) * k * 2];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Polar helper: angle 0 = 12 o'clock, clockwise.
export const polar = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
export function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

export const lerpColor = (a, b, t) => {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};
