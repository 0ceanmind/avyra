import { icon } from '../icons.js';
import { CASES, FACTORS, WEIGHTS, WEIGHTS_AOG, decide, explain, NAMES } from '../scoring.js';
import { $, $$, fmt, tweenNum } from './util.js';

const TOGGLES = [
  { id: 'staff', label: 'الفنيون المؤهلون متاحون', ic: 'users' },
  { id: 'stock', label: 'القطعة في المخزون المحلي', ic: 'box' },
  { id: 'labor', label: 'العقد يغطي عمالة المتعاقد', ic: 'file' },
  { id: 'aog', label: 'أولوية قصوى — AOG', ic: 'zap' },
];
const PRESETS = [
  { staff: true, stock: true, labor: false, aog: false },
  { staff: false, stock: true, labor: false, aog: false },
];

function compute(t) {
  const base = CASES[0];
  const team = { ...base.team }, mro = { ...base.mro };
  if (!t.staff) { team.ready = 10; team.hours += 12; }
  if (!t.stock) { team.part = 30; team.hours += 10; mro.part = 70; mro.hours += 4; }
  if (t.labor) { mro.cover = 100; mro.cost -= 6000; }
  const w = t.aog ? WEIGHTS_AOG : WEIGHTS;
  return { r: decide(team, mro, w), w };
}

const bar = (k) => `
  <div class="lg-row" data-o="${k}">
    <div class="lg-name"><span>${icon(k === 'team' ? 'users' : 'hangar', 30)}</span><b>${NAMES[k]}</b><em class="lg-win">التوصية</em></div>
    <div class="lg-track">${FACTORS.map((f) => `<i data-f="${f.id}" style="--c:${f.color}"></i>`).join('')}</div>
    <b class="lg-total num" data-k="t-${k}">0</b>
  </div>`;

export default {
  id: 'logic',
  title: 'منطق شفاف',
  chapter: 'المنتج',
  steps: 2,
  notes: `ليس صندوقاً أسود: كل توصية = مجموع (الوزن × المعيار) لخمسة معايير مرئية: الوقت، التكلفة، الجاهزية، القطعة، التغطية التعاقدية.
Claude يولّد التفسير بلغة مفهومة للمهندس، لكن القرار الحسابي شفاف وقابل للتتبّع.
الخطوة 2: نُطفئ "الفنيون متاحون" — تنقلب التوصية إلى المتعاقد مباشرة.
يمكن تجربة أي مفتاح أمام اللجنة. "عرض الحساب" يكشف المعادلة كاملة. (أرقام محاكاة)`,
  html: () => `
    <div class="eyebrow" data-in="0">منطق شفاف</div>
    <h2 class="t-l" data-in="0" style="--d:100">لا صندوق أسود.</h2>
    <p class="lg-formula num" data-in="0" style="--d:200"><span>الدرجة</span> = Σ <span>الوزن</span> × <span>المعيار</span></p>
    <div class="lg-board" data-in="0" style="--d:300">
      ${bar('team')}${bar('mro')}
      <div class="lg-legend">${FACTORS.map((f) => `<span><i style="background:${f.color}"></i>${f.short} <b class="num ltr" data-w="${f.id}">${Math.round(WEIGHTS[f.id] * 100)}%</b></span>`).join('')}</div>
      <div class="lg-explain glass">
        <span class="lg-ai">${icon('sparkle', 26)} Claude</span>
        <p data-k="exp"></p>
        <span class="lg-conf"><span class="small">الثقة</span><b class="num ltr" data-k="conf">0%</b></span>
      </div>
    </div>
    <aside class="lg-side glass no-drag" data-in="0" style="--d:420">
      <h3>غيّر الظروف</h3>
      ${TOGGLES.map((t) => `<div class="lg-tg"><span>${icon(t.ic, 28)}${t.label}</span><button class="switch" role="switch" aria-checked="false" data-t="${t.id}" aria-label="${t.label}"></button></div>`).join('')}
      <button class="lg-calc-btn" data-k="calcbtn">${icon('calc', 24)} عرض الحساب</button>
    </aside>
    <div class="pop lg-calc" data-k="calc"></div>
  `,
  mount(el) {
    this.el = el;
    this.t = { ...PRESETS[0] };
    this.sw = $$(el, '.switch');
    this.sw.forEach((s) => s.addEventListener('click', () => { this.t[s.dataset.t] = !this.t[s.dataset.t]; this.render(); }));
    const calc = $(el, '[data-k="calc"]');
    $(el, '[data-k="calcbtn"]').addEventListener('click', (e) => { e.stopPropagation(); calc.classList.toggle('show'); });
    el.addEventListener('click', (e) => { if (!e.target.closest('.lg-calc, [data-k="calcbtn"]')) calc.classList.remove('show'); });
  },
  render() {
    const el = this.el;
    const { r, w } = compute(this.t);
    this.sw.forEach((s) => s.setAttribute('aria-checked', String(!!this.t[s.dataset.t])));
    for (const k of ['team', 'mro']) {
      const row = $(el, `.lg-row[data-o="${k}"]`);
      row.classList.toggle('win', r.winner === k);
      FACTORS.forEach((f) => { $(row, `[data-f="${f.id}"]`).style.width = `${r[k].contrib[f.id]}%`; });
      tweenNum($(el, `[data-k="t-${k}"]`), r[k].total, { duration: 0.8, format: (v) => v.toFixed(1) });
    }
    FACTORS.forEach((f) => { $(el, `[data-w="${f.id}"]`).textContent = Math.round(w[f.id] * 100) + '%'; });
    tweenNum($(el, '[data-k="conf"]'), r.confidence, { duration: 0.8, format: (v) => Math.round(v) + '%' });
    const exp = $(el, '[data-k="exp"]');
    exp.classList.remove('in');
    void exp.offsetWidth;
    exp.textContent = explain(r);
    exp.classList.add('in');
    $(el, '[data-k="calc"]').innerHTML = `
      <h4>الحساب الكامل</h4>
      <table class="lg-tbl">
        <thead><tr><th>المعيار</th><th>الوزن</th><th>${NAMES.team}</th><th>${NAMES.mro}</th></tr></thead>
        <tbody>${FACTORS.map((f) => `<tr><td>${f.label}</td><td class="num ltr">${w[f.id].toFixed(2)}</td><td class="num ltr">${fmt(r.team.s[f.id], 0)} → ${r.team.contrib[f.id].toFixed(1)}</td><td class="num ltr">${fmt(r.mro.s[f.id], 0)} → ${r.mro.contrib[f.id].toFixed(1)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td>المجموع</td><td></td><td class="num ltr">${r.team.total.toFixed(1)}</td><td class="num ltr">${r.mro.total.toFixed(1)}</td></tr></tfoot>
      </table>
      <p class="small">الثقة = 50 + 1.6 × الفارق (بحد أقصى 96%) · بيانات محاكاة</p>`;
  },
  step(s) {
    this.t = { ...PRESETS[s] };
    this.render();
  },
  leave() { $(this.el, '[data-k="calc"]').classList.remove('show'); },
};
