import { icon } from '../icons.js';
import { $, $$, fmt } from './util.js';

const FUNDS = [
  { p: 40, t: 'تطوير المنتج والتكامل التقني', s: 'RAG · AMOS / ERP', c: '#3ad8f7' },
  { p: 30, t: 'المبيعات والشراكات', s: 'عملاء تجريبيون · مؤتمرات', c: '#2ee6c5' },
  { p: 20, t: 'الفريق والتوظيف', s: '', c: '#3a7bff' },
  { p: 10, t: 'التشغيل والاستضافة السحابية', s: '', c: '#b7c3ff' },
];
const R = 210, CIRC = 2 * Math.PI * R, GAP = 1.2;

export default {
  id: 'ask',
  title: 'الطلب المالي',
  chapter: 'الاستثمار',
  steps: 1,
  notes: `الطلب المالي — كم نطلب، ولأي مدة، وأين تذهب الأموال؟
• كم؟ جولة تمويل مبدئية.  • مقابل ماذا؟ نسبة ملكية.  • لأي مدة؟ 12–18 شهر تمويل تشغيل.
توزيع استخدام الأموال (مقترح): 40% تطوير المنتج والتكامل التقني (RAG, AMOS/ERP) · 30% المبيعات والشراكات (عملاء تجريبيون، مؤتمرات) · 20% الفريق والتوظيف · 10% التشغيل والاستضافة السحابية.
(المبلغ ونسبة الملكية تُضاف في src/config.js — عند إضافتها تظهر المبالغ لكل بند تلقائياً.)`,
  html: ({ config }) => {
    const a = config.ask;
    let acc = 0;
    const segs = FUNDS.map((f, i) => {
      const len = (f.p / 100) * CIRC - GAP * 2;
      const off = -acc * CIRC / 100 - GAP;
      acc += f.p;
      return `<circle class="ak-seg" data-i="${i}" cx="280" cy="280" r="${R}" stroke="${f.c}" stroke-dasharray="${len.toFixed(1)} ${CIRC.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="--len:${len.toFixed(1)};--d:${400 + i * 180}"/>`;
    }).join('');
    const tiles = [
      a.amount && { k: 'كم؟', v: a.amount, s: 'جولة تمويل مبدئية' },
      a.equity && { k: 'مقابل ماذا؟', v: a.equity, s: 'نسبة ملكية' },
      a.runway && { k: 'لأي مدة؟', v: `${a.runway}`, s: 'شهراً تمويل تشغيل' },
    ].filter(Boolean);
    return `
    <div class="eyebrow" data-in="0">الاستثمار</div>
    <h2 class="t-l" data-in="0" style="--d:100">الطلب المالي</h2>
    <p class="lead" data-in="0" style="--d:200">كم نطلب، ولأي مدة، وأين تذهب الأموال؟</p>
    <div class="ak-donut" data-in="0" style="--d:250">
      <svg viewBox="0 0 560 560" aria-hidden="true"><circle class="ak-trk" cx="280" cy="280" r="${R}"/>${segs}</svg>
      <div class="ak-center"><b class="num ltr" data-k="cp">100%</b><span data-k="ct">استخدام الأموال</span><em class="num ltr" data-k="ca"></em></div>
    </div>
    <div class="ak-col">
      <div class="ak-tiles">${tiles.map((t, i) => `<div class="ak-tile glass" data-in="0" style="--d:${300 + i * 120}"><span class="label">${t.k}</span><b class="num ltr">${t.v}</b><span class="small">${t.s}</span></div>`).join('')}</div>
      <ul class="ak-legend">${FUNDS.map((f, i) => `
        <li data-i="${i}" data-in="0" style="--d:${500 + i * 120}">
          <i style="background:${f.c}"></i><b class="num ltr">${f.p}%</b>
          <span><span class="t">${f.t}</span>${f.s ? `<span class="s ltr">${f.s}</span>` : ''}</span>
          ${a.amountValue ? `<em class="num ltr">${fmt(a.amountValue * f.p / 100)}</em>` : ''}
        </li>`).join('')}</ul>
      <p class="small ak-note" data-in="0" style="--d:1000">${icon('info', 20)} توزيع مقترح</p>
    </div>`;
  },
  mount(el, ctx) {
    const cp = $(el, '[data-k="cp"]'), ct = $(el, '[data-k="ct"]'), ca = $(el, '[data-k="ca"]');
    const amt = ctx.config.ask.amountValue;
    const set = (i) => {
      $$(el, '.ak-seg, .ak-legend li').forEach((x) => x.classList.toggle('dim', i != null && +x.dataset.i !== i));
      if (i == null) { cp.textContent = '100%'; ct.textContent = 'استخدام الأموال'; ca.textContent = ''; return; }
      cp.textContent = FUNDS[i].p + '%';
      ct.textContent = FUNDS[i].t;
      ca.textContent = amt ? fmt((amt * FUNDS[i].p) / 100) : '';
    };
    $$(el, '.ak-seg, .ak-legend li').forEach((x) => {
      x.addEventListener('mouseenter', () => set(+x.dataset.i));
      x.addEventListener('mouseleave', () => set(null));
      x.addEventListener('click', () => set(+x.dataset.i));
    });
  },
};
