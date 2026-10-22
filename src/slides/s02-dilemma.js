import { icon } from '../icons.js';
import { $$ } from './util.js';

// Four disconnected systems placed around the grounded aircraft.
const SILOS = [
  { name: 'التنبؤ بالعطل', ic: 'activity', x: 120, y: 262 },
  { name: "مخزون القطع", ic: "box", x: 640, y: 228 },
  { name: 'العقود', ic: 'file', x: 120, y: 880 },
  { name: "توفّر الفنيين", ic: "users", x: 640, y: 912 },
];
const W = 340, H = 92;

export default {
  id: 'dilemma',
  title: 'عطل غير مجدول',
  chapter: 'المشكلة',
  three: 'aog',
  steps: 3,
  notes: `المستخدم: مهندسو ومدراء صيانة الطائرات في شركات الطيران الإقليمية ومزودي MRO (أساطيل 10–40 طائرة) في عُمان والخليج.
عند حدوث عطل غير مجدول، القرار — فريق محلي أم مزوّد متعاقد؟ — يُتخذ يدوياً عبر مكالمات ومراجعة عقود ورقية.
البيانات مبعثرة بين 4 أنظمة منفصلة: التنبؤ بالعطل، مخزون القطع، العقود، توفّر الفنيين.
خطوات: (1) السؤال  (2) الأنظمة الأربعة المنفصلة.`,
  html: () => `
    <svg class="dl-links fade" viewBox="0 0 1920 1080" data-in="2" aria-hidden="true">
      ${SILOS.map(() => `<g class="dl-link"><path class="a"/><path class="b"/><g class="x"><circle r="15"/><path d="M-5,-5 L5,5 M5,-5 L-5,5"/></g></g>`).join('')}
    </svg>
    ${SILOS.map((s, i) => `
      <div class="dl-silo glass" data-in="2" style="--d:${120 + i * 110};left:${s.x}px;top:${s.y}px;width:${W}px;height:${H}px">
        <span class="dl-ic">${icon(s.ic, 30)}</span><span class="dl-name">${s.name}</span><span class="dl-off">منفصل</span>
      </div>`).join('')}
    <div class="dl-col">
      <div class="eyebrow" data-in="0">المشكلة</div>
      <h2 class="t-l" data-in="0" style="--d:100">عطل غير مجدول.</h2>
      <p class="t-s muted" data-in="0" style="--d:220">الطائرة على الأرض — والقرار معلّق.</p>
      <div class="dl-persona" data-in="0" style="--d:380">
        <span class="chip sm">${icon('user')} مهندسو ومدراء الصيانة</span>
        <span class="chip sm">${icon('plane')} أساطيل 10–40 طائرة</span>
        <span class="chip sm">${icon('hangar')} شركات طيران إقليمية و MRO</span>
        <span class="chip sm">${icon('pin')} عُمان والخليج</span>
      </div>
      <div class="dl-q" data-in="1">
        <span class="opt">فريق محلي</span><span class="or">أم</span><span class="opt">متعاقد MRO</span><span class="qm">؟</span>
      </div>
      <div class="dl-manual" data-in="2" style="--d:520">
        <div class="dl-manual-row"><span class="chip">${icon('phone')} مكالمات</span><span class="chip">${icon('file')} عقود ورقية</span><span class="chip">${icon('clock')} يدوياً</span></div>
        <p class="label">البيانات مبعثرة بين <b class="c-red">4 أنظمة منفصلة</b></p>
      </div>
    </div>
  `,
  mount(el) {
    this.links = $$(el, '.dl-link');
  },
  enter(el, ctx) {
    ctx.stage3d.setMarker('engine', '<b>AOG</b> عطل غير مجدول · المحرك 1', 'red');
    const centers = SILOS.map((s) => [s.x + W / 2, s.y + H / 2]);
    this.off = ctx.stage3d.onFrame((m) => {
      if (!m.ok || !el.classList.contains('st-2')) return;
      this.links.forEach((g, i) => {
        const [cx, cy] = centers[i];
        const p = (t) => [m.x + (cx - m.x) * t, m.y + (cy - m.y) * t];
        const [ax, ay] = p(0.06), [bx, by] = p(0.44), [c2x, c2y] = p(0.6), [dx, dy] = p(0.92), [xx, xy] = p(0.52);
        g.children[0].setAttribute('d', `M${ax},${ay} L${bx},${by}`);
        g.children[1].setAttribute('d', `M${c2x},${c2y} L${dx},${dy}`);
        g.children[2].setAttribute('transform', `translate(${xx},${xy})`);
      });
    });
  },
  leave(el, ctx) {
    this.off?.();
    ctx.stage3d.setMarker(null);
  },
};
