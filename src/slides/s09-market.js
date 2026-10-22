import { icon } from '../icons.js';
import { $, $$ } from './util.js';

// Rings are nested, not to scale; each step zooms one level deeper.
const C = [430, 400];
const RINGS = [
  { k: 'TAM', r: 330, cls: 'tam' },
  { k: 'SAM', r: 196, cls: 'sam' },
  { k: 'SOM', r: 86, cls: 'som' },
];
const SCALE = RINGS.map((x) => RINGS[0].r / x.r);

function sunflower(n, rMax) {
  const pts = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const r = rMax * Math.sqrt((i + 0.5) / n);
    pts.push([C[0] + r * Math.cos(i * g), C[1] + r * Math.sin(i * g), 1.3 + ((i * 7) % 11) / 8]);
  }
  return pts;
}

const INFO = [
  { val: '$88.7B', unit: 'مليار دولار', desc: 'سوق صيانة وإصلاح وعمرة الطائرات (MRO) عالمياً', chip: 'نمو 6.8% سنوياً' },
  { val: '$6.3B', unit: 'مليار دولار', desc: 'حلول الصيانة التنبؤية بالذكاء الاصطناعي عالمياً', chip: 'نمو 10–17% سنوياً' },
  { val: '1–3M', unit: 'مليون ر.ع. سنوياً', desc: '30–50 شركة طيران / MRO في عُمان والخليج — أساطيل 10–40 طائرة', chip: '≈ $2.6–7.8M' },
];

export default {
  id: 'market',
  title: 'حجم السوق',
  chapter: 'السوق',
  steps: 3,
  notes: `حجم السوق — سوق بمليارات الدولارات، وبوابة دخول واضحة في الخليج.
TAM: 88.7 مليار $ — سوق MRO عالمياً، نمو 6.8% سنوياً.
SAM: 6.3 مليار $ — حلول الصيانة التنبؤية بالذكاء الاصطناعي عالمياً، نمو 10–17% سنوياً.
SOM: 1–3 مليون ر.ع. سنوياً — 30–50 شركة طيران/MRO محتملة في عُمان والخليج تدير أساطيل 10–40 طائرة (≈ 2.6–7.8 مليون $ بسعر الربط 1 ر.ع. = 2.6 $).
الدوائر للتوضيح وليست بمقياس حقيقي. كل خطوة = تكبير لمستوى أعمق.`,
  html: () => `
    <div class="mt-zone fade" data-in="0">
      <svg viewBox="0 0 860 800" aria-hidden="true">
        <defs>
          ${RINGS.map((x) => `<radialGradient id="mg-${x.cls}" cx="50%" cy="40%" r="60%"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></radialGradient>`).join('')}
        </defs>
        <g class="mt-g" style="transform-origin:${C[0]}px ${C[1]}px">
          ${RINGS.map((x, i) => `
            <g class="mt-ring ${x.cls}" data-l="${i}">
              <circle cx="${C[0]}" cy="${C[1]}" r="${x.r}" fill="url(#mg-${x.cls})"/>
              <text x="${C[0]}" y="${C[1] - x.r + 58 / SCALE[i]}" style="font-size:${40 / SCALE[i]}px">${x.k}</text>
            </g>`).join('')}
          <g class="mt-dots">${sunflower(40, 70).map(([x, y, r], i) => `<circle cx="${x.toFixed(1)}" cy="${(y + 6).toFixed(1)}" r="${(r / SCALE[2] * 2.2).toFixed(2)}" style="--i:${i}"/>`).join('')}</g>
        </g>
      </svg>
      <span class="mt-note small">للتوضيح — ليس بمقياس حقيقي</span>
    </div>
    <div class="mt-col">
      <div class="eyebrow" data-in="0">السوق</div>
      <h2 class="t-l" data-in="0" style="--d:100">حجم السوق</h2>
      <p class="lead" data-in="0" style="--d:200">سوق بالمليارات… وبوابة دخول واضحة في الخليج.</p>
      <div class="mt-pills no-drag" data-in="0" style="--d:300">${RINGS.map((x, i) => `<button data-l="${i}">${x.k}</button>`).join('')}</div>
      <div class="mt-info" data-in="0" style="--d:400">
        ${INFO.map((x, i) => `
          <div class="mt-i" data-l="${i}">
            <div class="mt-v num ltr">${x.val}</div>
            <div class="mt-u">${x.unit}</div>
            <p class="body">${x.desc}</p>
            <span class="chip">${icon(i === 2 ? 'pin' : 'trend')} ${x.chip}</span>
          </div>`).join('')}
      </div>
    </div>
  `,
  mount(el, ctx) {
    this.g = $(el, '.mt-g');
    $$(el, '.mt-pills button').forEach((b) => b.addEventListener('click', () => ctx.deck.go(ctx.deck.index, +b.dataset.l)));
  },
  step(s, el) {
    el.dataset.level = s;
    this.g.style.transform = `scale(${SCALE[s]})`;
    $$(el, '.mt-pills button').forEach((b) => b.classList.toggle('on', +b.dataset.l === s));
    $$(el, '.mt-i').forEach((b) => b.classList.toggle('on', +b.dataset.l === s));
    $$(el, '.mt-ring').forEach((g) => g.classList.toggle('on', +g.dataset.l === s));
  },
};
