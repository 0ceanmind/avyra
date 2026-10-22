import { gsap } from 'gsap';
import { icon } from '../icons.js';
import { $, $$, smoothPath } from './util.js';

// Waypoints in a 1640×560 SVG (LTR coordinates). Journey runs right → left.
const WP = [
  { p: [1560, 430], when: 'اليوم', title: 'نموذج أوّلي — محاكاة', chips: ['n8n', 'RAG'], side: 'up' },
  { p: [1090, 330], when: '3 أشهر', title: 'Orchestrator كامل', sub: 'تحليل عقود الصيانة فعلياً', side: 'down' },
  { p: [620, 250], when: '6–12 شهراً', title: 'تكامل حقيقي + عميل أوّل', chips: ['AMOS / Trax', 'AMM / IPC'], side: 'up' },
  { p: [150, 120], when: '12–24 شهراً', title: 'التوسّع لأساطيل الخليج', side: 'down' },
];
const PATH = smoothPath([[1700, 470], ...WP.map((w) => w.p), [-40, 70]], 0.55);

export default {
  id: 'roadmap',
  title: 'خارطة الطريق',
  chapter: 'خارطة الطريق',
  steps: 4,
  notes: `خارطة الطريق — من النموذج الأولي إلى التكامل الحقيقي:
• اليوم: نموذج أولي في محاكاة ببيانات (n8n + RAG).
• 3 أشهر: Orchestrator كامل لتحليل عقود الصيانة فعلياً.
• 6–12 شهراً: تكامل حقيقي مع AMOS/Trax + AMM/IPC + تجربة مع عميل حقيقي واحد.
• 12–24 شهراً: التوسع لبقية أساطيل الخليج.
كل خطوة تُقدّم الطائرة إلى المحطة التالية.`,
  html: () => `
    <div class="eyebrow" data-in="0">خارطة الطريق</div>
    <h2 class="t-l" data-in="0" style="--d:100">من النموذج الأوّلي… <span class="grad">إلى التكامل الحقيقي.</span></h2>
    <div class="rm" data-in="0" style="--d:250">
      <svg viewBox="0 0 1640 560" aria-hidden="true">
        <defs><linearGradient id="rmg" x1="1" x2="0"><stop offset="0" stop-color="#93e25b"/><stop offset=".5" stop-color="#3ad8f7"/><stop offset="1" stop-color="#3a7bff"/></linearGradient></defs>
        <path class="rm-base" d="${PATH}"/>
        <path class="rm-prog" d="${PATH}" data-k="prog"/>
        ${WP.map((w, i) => `<g class="rm-wp" data-i="${i}"><circle class="h" cx="${w.p[0]}" cy="${w.p[1]}" r="26"/><circle cx="${w.p[0]}" cy="${w.p[1]}" r="11"/></g>`).join('')}
        <g class="rm-plane" data-k="plane"><g transform="rotate(45) scale(2.3) translate(-12,-12)">${icon('plane').replace(/<\/?svg[^>]*>/g, '')}</g></g>
      </svg>
      ${WP.map((w, i) => `
        <div class="rm-card ${w.side}" data-i="${i}" style="left:${w.p[0]}px;top:${w.p[1]}px">
          <span class="rm-when">${w.when}</span>
          <b>${w.title}</b>
          ${w.sub ? `<span class="rm-sub">${w.sub}</span>` : ''}
          ${w.chips ? `<span class="rm-chips">${w.chips.map((c) => `<span class="chip sm ltr">${c}</span>`).join('')}</span>` : ''}
        </div>`).join('')}
    </div>
  `,
  mount(el) {
    this.path = $(el, '[data-k="prog"]');
    this.plane = $(el, '[data-k="plane"]');
    this.len = 0;
    this.pos = { v: 0 };
  },
  measure() {
    if (this.len) return;
    this.len = this.path.getTotalLength();
    // Arc length of each waypoint along the path
    const N = 600;
    this.wpLen = WP.map((w) => {
      let best = 0, bd = Infinity;
      for (let i = 0; i <= N; i++) {
        const l = (i / N) * this.len;
        const p = this.path.getPointAtLength(l);
        const d = (p.x - w.p[0]) ** 2 + (p.y - w.p[1]) ** 2;
        if (d < bd) { bd = d; best = l; }
      }
      return best;
    });
    this.path.style.strokeDasharray = `${this.len}`;
  },
  place(l) {
    const p = this.path.getPointAtLength(l);
    const q = this.path.getPointAtLength(Math.max(0, l - 2));
    const ang = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI;
    this.plane.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    this.path.style.strokeDashoffset = String(this.len - l);
  },
  enter() {
    this.measure();
    this.pos.v = 0;
    this.place(0);
  },
  step(s, el) {
    this.measure();
    $$(el, '.rm-card, .rm-wp').forEach((c) => c.classList.toggle('on', +c.dataset.i <= s));
    $$(el, '.rm-card').forEach((c) => c.classList.toggle('cur', +c.dataset.i === s));
    gsap.killTweensOf(this.pos);
    gsap.to(this.pos, { v: this.wpLen[s], duration: s === 0 ? 1.6 : 1.4, delay: s === 0 ? 0.4 : 0, ease: 'power2.inOut', onUpdate: () => this.place(this.pos.v) });
  },
  leave() { gsap.killTweensOf(this.pos); },
};
