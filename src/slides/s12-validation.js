import { gsap } from 'gsap';
import { icon } from '../icons.js';
import { $, arc, polar, tweenNum } from './util.js';

export default {
  id: 'validation',
  title: 'الإثبات والتحقق',
  chapter: 'التحقق',
  steps: 1,
  notes: `الإثبات والتحقق (Validation) — مبني على بحث ميداني حقيقي، وجاهز للتحقق الميداني.
• بحث سوق ومقابلات مع شخصية المستخدم المستهدف (مدير MRO) أكّدت الألم: ساعات ضائعة يومياً في مكالمات ومقارنات يدوية.
• Demo Mode (سيناريو محاكاة كامل بطائرة واحدة) يعرض التوصية النهائية خلال أقل من 60 ثانية.
• الهدف المحدد للتحقق القادم: نسبة موافقة المهندس على التوصية من أول محاولة > 70%.
جميع أرقام Demo Mode هي "بيانات محاكاة — Simulation"، ولا تُفهم كنتيجة عميل فعلي. الصدق هنا يبني ثقة أكبر من رقم مبالغ فيه.`,
  html: () => {
    const G = { cx: 160, cy: 160, r: 128 };
    const a0 = -Math.PI / 2, a1 = Math.PI / 2;
    const at = a0 + (a1 - a0) * 0.7;
    const [tx0, ty0] = polar(G.cx, G.cy, G.r - 26, at), [tx1, ty1] = polar(G.cx, G.cy, G.r + 14, at);
    return `
    <div class="eyebrow" data-in="0">التحقق · Validation</div>
    <h2 class="t-l" data-in="0" style="--d:100">الإثبات والتحقق</h2>
    <p class="lead" data-in="0" style="--d:200">بُني على بحث ميداني حقيقي — وجاهز للتحقق الميداني.</p>
    <div class="vd-grid">
      <div class="vd-card glass" data-in="0" style="--d:350">
        <div class="vd-vis vd-voice">
          <span class="vd-av">${icon('user', 40)}</span>
          <span class="vd-wave">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span>
          <span class="vd-av b">${icon('mic', 36)}</span>
        </div>
        <b class="vd-big">مقابلات ميدانية</b>
        <p class="body">مع مدراء MRO — أكّدت الألم:</p>
        <p class="vd-quote">«ساعات ضائعة يومياً في مكالمات ومقارنات يدوية»</p>
      </div>
      <div class="vd-card glass" data-in="0" style="--d:500">
        <div class="vd-vis">
          <svg class="vd-timer" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="92"/><circle class="p" cx="110" cy="110" r="92" pathLength="100" data-k="tarc"/></svg>
          <div class="vd-tin"><b class="num ltr">&lt; <span data-k="sec">60</span></b><span>ثانية</span></div>
        </div>
        <b class="vd-big">Demo Mode</b>
        <p class="body">سيناريو محاكاة كامل بطائرة واحدة — التوصية النهائية خلال أقل من 60 ثانية</p>
      </div>
      <div class="vd-card glass" data-in="0" style="--d:650">
        <div class="vd-vis">
          <svg class="vd-gauge" viewBox="0 0 320 200" aria-hidden="true">
            <path class="trk" d="${arc(G.cx, G.cy, G.r, a0, a1)}"/>
            <path class="fill" d="${arc(G.cx, G.cy, G.r, a0, a1)}" pathLength="100" data-k="garc"/>
            <line class="tgt" x1="${tx0.toFixed(1)}" y1="${ty0.toFixed(1)}" x2="${tx1.toFixed(1)}" y2="${ty1.toFixed(1)}"/>
            <g class="needle" data-k="needle" style="transform-origin:${G.cx}px ${G.cy}px"><line x1="${G.cx}" y1="${G.cy}" x2="${G.cx}" y2="${G.cy - G.r + 30}"/><circle cx="${G.cx}" cy="${G.cy}" r="9"/></g>
          </svg>
          <div class="vd-gin"><b class="num ltr">&gt; <span data-k="pct">0</span>%</b></div>
        </div>
        <b class="vd-big">الهدف القادم</b>
        <p class="body">موافقة المهندس على التوصية من أول محاولة</p>
      </div>
    </div>
    <div class="vd-honest" data-in="0" style="--d:900">${icon('info', 30)}<p>جميع أرقام Demo Mode <b>بيانات محاكاة — Simulation</b>، ولا تُفهم كنتيجة عميل فعلي. <span class="muted">الصدق هنا يبني ثقة أكبر من رقم مبالغ فيه.</span></p></div>
  `;
  },
  mount(el) { this.el = el; },
  enter(el) {
    const tarc = $(el, '[data-k="tarc"]'), garc = $(el, '[data-k="garc"]'), needle = $(el, '[data-k="needle"]');
    const o = { t: 0, g: 0 };
    tarc.style.strokeDashoffset = '100';
    garc.style.strokeDashoffset = '100';
    needle.style.transform = 'rotate(-90deg)';
    this.tl = gsap.timeline({ delay: 0.9 })
      .to(o, { t: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: () => { tarc.style.strokeDashoffset = String(100 - o.t * 100); } }, 0)
      .to(o, { g: 0.7, duration: 1.8, ease: 'power3.out', onUpdate: () => { garc.style.strokeDashoffset = String(100 - o.g * 100); needle.style.transform = `rotate(${-90 + o.g * 180}deg)`; } }, 0.3);
    tweenNum($(el, '[data-k="pct"]'), 70, { duration: 1.8, ease: 'power3.out' }).delay(1.2);
  },
  leave() { this.tl?.kill(); },
};
