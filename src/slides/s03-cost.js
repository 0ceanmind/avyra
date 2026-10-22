import { gsap } from 'gsap';
import { $, fmt, lerpColor, polar, arc, setNum } from './util.js';

const CX = 340, CY = 340, R0 = 262, R1 = 300;
const RATE = 10000; // $ per AOG hour (deck figure)

export default {
  id: 'cost',
  title: 'ثمن الانتظار',
  chapter: 'المشكلة',
  steps: 3,
  notes: `أرقام المشكلة من العرض:
• 24–48 ساعة: زمن القرار اليدوي الحالي.
• 10,000$: تكلفة توقف الطائرة على الأرض (AOG) بالساعة.
• 68% من قادة MRO يضعون الذكاء الاصطناعي أولوية في 2026.
العدّاد = ساعات الانتظار × 10,000$ — اسحب المؤشر لتوضيح الأثر مباشرة.
الخلاصة: قرار صيانة واحد يكلّف شركات الطيران أياماً وعشرات آلاف الدولارات.`,
  html: () => {
    const ticks = Array.from({ length: 48 }, (_, i) => {
      const a = ((i + 0.5) / 48) * Math.PI * 2;
      const [x0, y0] = polar(CX, CY, R0, a), [x1, y1] = polar(CX, CY, R1, a);
      return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" style="--c:${lerpColor('ffb547', 'ff5b4f', i / 47)}"/>`;
    }).join('');
    const hourLabels = [0, 12, 24, 36].map((h) => {
      const [x, y] = polar(CX, CY, R1 + 30, (h / 48) * Math.PI * 2);
      return `<text x="${x.toFixed(1)}" y="${(y + 8).toFixed(1)}">${h}</text>`;
    }).join('');
    return `
    <div class="cs-ring zoom" data-in="0">
      <svg viewBox="0 0 680 680" aria-hidden="true">
        <circle class="cs-glow" cx="${CX}" cy="${CY}" r="230"/>
        <path class="cs-window" d="${arc(CX, CY, 360, Math.PI, Math.PI * 2 - 0.001)}"/>
        <g class="cs-ticks">${ticks}</g>
        <g class="cs-hours">${hourLabels}</g>
      </svg>
      <div class="cs-center">
        <div class="cs-h"><span class="num" data-k="h">0</span> ساعة انتظار</div>
        <div class="cs-money num ltr">$<span data-k="money">0</span></div>
        <div class="label">تكلفة توقف الطائرة</div>
      </div>
      <div class="cs-legend small"><i></i> نافذة القرار اليدوي الحالية</div>
    </div>
    <label class="cs-slider no-drag" data-in="0" style="--d:600">
      <span class="label">اسحب: ساعات الانتظار</span>
      <input class="range" type="range" min="0" max="48" step="1" value="0" data-k="range" style="--fill:#ff5b4f">
    </label>
    <div class="cs-col">
      <div class="eyebrow" data-in="0">المشكلة</div>
      <h2 class="t-l" data-in="0" style="--d:100">الانتظار… مكلف.</h2>
      <ul class="cs-stats">
        <li data-in="0" style="--d:300"><span class="v num ltr">24–48</span><span class="u">ساعة</span><span class="k">زمن القرار اليدوي الحالي</span></li>
        <li data-in="0" style="--d:450"><span class="v num ltr">$10,000</span><span class="u">/ ساعة</span><span class="k">تكلفة توقف الطائرة (AOG)</span></li>
        <li data-in="2" class="cs-68">
          <svg viewBox="0 0 120 120" class="cs-donut"><circle cx="60" cy="60" r="50"/><circle class="p" cx="60" cy="60" r="50" pathLength="100"/></svg>
          <span class="v num ltr">68%</span><span class="k">من قادة MRO: الذكاء الاصطناعي أولوية 2026</span>
        </li>
      </ul>
    </div>`;
  },
  mount(el) {
    this.lines = [...el.querySelectorAll('.cs-ticks line')];
    this.hEl = $(el, '[data-k="h"]');
    this.mEl = $(el, '[data-k="money"]');
    this.range = $(el, '[data-k="range"]');
    this.state = { h: 0 };
    this.range.addEventListener('input', () => {
      gsap.killTweensOf(this.state);
      this.state.h = +this.range.value;
      this.render(true);
    });
  },
  render(fromSlider = false) {
    const h = this.state.h;
    this.lines.forEach((l, i) => l.classList.toggle('on', i < Math.round(h)));
    setNum(this.hEl, Math.round(h));
    setNum(this.mEl, h * RATE);
    if (!fromSlider) this.range.value = Math.round(h);
    this.range.style.setProperty('--p', `${(h / 48) * 100}%`);
  },
  to(h, d = 2.2) {
    gsap.killTweensOf(this.state);
    gsap.to(this.state, { h, duration: d, ease: 'power2.inOut', onUpdate: () => this.render() });
  },
  enter() { this.state.h = 0; this.render(); },
  step(s) { this.to(s === 0 ? 24 : 48, s === 0 ? 2.4 : 1.8); },
  leave() { gsap.killTweensOf(this.state); },
};
