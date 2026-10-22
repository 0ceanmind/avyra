import { icon } from '../icons.js';
import { $, $$, fmt, tweenNum } from './util.js';

const SLIDERS = [
  { k: 'price', label: 'الاشتراك (ر.ع. / طائرة / شهر)', min: 50, max: 600, step: 10 },
  { k: 'fleet', label: 'متوسط الأسطول لكل عميل', min: 10, max: 40, step: 1 },
  { k: 'c0', label: 'العملاء — السنة 1', min: 0, max: 20, step: 1 },
  { k: 'c1', label: 'العملاء — السنة 2', min: 0, max: 40, step: 1 },
  { k: 'c2', label: 'العملاء — السنة 3', min: 0, max: 50, step: 1 },
];
const CH = 470; // chart plot height (px)
const money = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : Math.round(v / 1000) + 'K');

export default {
  id: 'finance',
  title: 'لقطة مالية',
  chapter: 'الاستثمار',
  steps: 1,
  notes: `لقطة مالية — التوقعات لثلاث سنوات: عدد العملاء، عدد الطائرات المُدارة، الإيراد السنوي المقدّر.
النموذج: الإيراد = العملاء × متوسط الأسطول × الاشتراك الشهري × 12 (اشتراك SaaS لكل طائرة).
الافتراضات الحالية توضيحية ويمكن تعديلها مباشرة أمام اللجنة ("تعديل الافتراضات")، والخط المتقطّع = الحد الأدنى لـ SOM (1M ر.ع.).
القيم الافتراضية في src/config.js.`,
  html: ({ config }) => `
    <div class="eyebrow" data-in="0">الاستثمار</div>
    <h2 class="t-l" data-in="0" style="--d:100">لقطة مالية</h2>
    <p class="lead" data-in="0" style="--d:200">التوقعات لثلاث سنوات</p>
    <span class="badge-sim fn-badge" data-in="0" style="--d:300">${icon('info')} سيناريو توضيحي — افتراضات قابلة للتعديل</span>
    <div class="fn-chart" data-in="0" style="--d:350">
      <div class="fn-som" data-k="som"><span class="small">SOM · 1M ر.ع.</span></div>
      ${[0, 1, 2].map((i) => `
        <div class="fn-col" data-y="${i}">
          <b class="fn-v num ltr"><span data-k="v${i}">0</span><small>ر.ع.</small></b>
          <div class="fn-bar"><i data-k="b${i}"></i></div>
          <span class="fn-y">السنة ${i + 1}</span>
          <span class="fn-meta"><span><b class="num" data-k="cu${i}">0</b> عملاء</span><span><b class="num" data-k="ac${i}">0</b> طائرة</span></span>
        </div>`).join('')}
    </div>
    <div class="fn-side">
      <div class="fn-sum glass" data-in="0" style="--d:450">
        <span class="label">الإيراد = العملاء × الأسطول × الاشتراك × 12</span>
        <b class="num" data-k="sum"></b>
        <button class="btn" data-k="edit">${icon('calc', 24)} تعديل الافتراضات</button>
      </div>
      <div class="fn-panel glass no-drag" data-k="panel">
        ${SLIDERS.map((s) => `
          <label class="fn-sl"><span>${s.label}<b class="num" data-o="${s.k}"></b></span>
            <input class="range" type="range" min="${s.min}" max="${s.max}" step="${s.step}" data-s="${s.k}"></label>`).join('')}
        <div class="fn-pfoot"><button class="fn-reset" data-k="reset">${icon('rotate', 20)} القيم الافتراضية</button><button class="btn primary" data-k="done">تم</button></div>
      </div>
    </div>
  `,
  mount(el, ctx) {
    this.el = el;
    const m = ctx.config.model;
    this.def = { price: m.price, fleet: m.fleet, c0: m.customers[0], c1: m.customers[1], c2: m.customers[2] };
    this.v = { ...this.def };
    this.inputs = $$(el, '[data-s]');
    this.inputs.forEach((inp) => inp.addEventListener('input', () => { this.v[inp.dataset.s] = +inp.value; this.render(false); }));
    $(el, '[data-k="edit"]').addEventListener('click', () => $(el, '[data-k="panel"]').classList.toggle('show'));
    $(el, '[data-k="done"]').addEventListener('click', () => $(el, '[data-k="panel"]').classList.remove('show'));
    $(el, '[data-k="reset"]').addEventListener('click', () => { this.v = { ...this.def }; this.render(true); });
  },
  render(anim = true) {
    const el = this.el, v = this.v;
    this.inputs.forEach((inp) => {
      inp.value = v[inp.dataset.s];
      const p = ((v[inp.dataset.s] - inp.min) / (inp.max - inp.min)) * 100;
      inp.style.setProperty('--p', p + '%');
      $(el, `[data-o="${inp.dataset.s}"]`).textContent = fmt(v[inp.dataset.s]);
    });
    const rev = [0, 1, 2].map((i) => v['c' + i] * v.fleet * v.price * 12);
    const max = Math.max(1.25e6, Math.max(...rev) * 1.2);
    rev.forEach((r, i) => {
      $(el, `[data-k="b${i}"]`).style.height = `${(r / max) * CH}px`;
      const d = anim ? 1.1 : 0.3;
      tweenNum($(el, `[data-k="v${i}"]`), r, { duration: d, format: money });
      tweenNum($(el, `[data-k="cu${i}"]`), v['c' + i], { duration: d });
      tweenNum($(el, `[data-k="ac${i}"]`), v['c' + i] * v.fleet, { duration: d });
    });
    $(el, '[data-k="som"]').style.bottom = `${(1e6 / max) * CH + 128}px`;
    $(el, '[data-k="sum"]').innerHTML = `<span class="ltr">${fmt(v.price)}</span> ر.ع./طائرة/شهر · متوسط <span class="ltr">${v.fleet}</span> طائرة`;
  },
  enter() {
    $$(this.el, '.fn-bar i').forEach((b) => (b.style.height = '0px'));
    setTimeout(() => this.render(true), 450);
  },
  leave() { $(this.el, '[data-k="panel"]').classList.remove('show'); },
};
