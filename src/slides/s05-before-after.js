import { icon } from '../icons.js';
import { $, $$, BASE } from './util.js';

export default {
  id: 'beforeafter',
  title: 'من أيام إلى دقيقة',
  chapter: 'الحل',
  steps: 2,
  notes: `قبل: 4 أنظمة منفصلة، مكالمات، عقود ورقية — 24–48 ساعة.
بعد: توصية واحدة موثّقة من AVYRA — أقل من دقيقة واحدة.
الشريط الزمني بمقياس حقيقي: 48 ساعة مقابل دقيقة واحدة (الأخضر بالكاد يُرى).
استخدم مفتاح قبل/بعد أو السهم.`,
  html: () => `
    <div class="ba-top">
      <div>
        <div class="eyebrow" data-in="0">قبل / بعد</div>
        <h2 class="t-l" data-in="0" style="--d:100">من أيام… <span class="grad">إلى دقيقة.</span></h2>
      </div>
      <div class="seg no-drag" data-in="0" style="--d:250">
        <i class="thumb"></i>
        <button data-s="0" aria-pressed="true">قبل</button>
        <button data-s="1" aria-pressed="false">بعد</button>
      </div>
    </div>
    <div class="ba-stage" data-in="0" style="--d:350">
      <div class="ba-state ba-before">
        <div class="ba-time"><span class="num ltr c-red">24–48</span><span class="u">ساعة</span></div>
        <div class="ba-chaos">
          <svg viewBox="0 0 700 420" aria-hidden="true">
            <path d="M120,90 C300,20 260,260 470,120 S620,330 560,330"/>
            <path d="M130,330 C260,200 420,380 540,90"/>
            <path d="M110,100 C200,250 380,180 360,360 S220,300 140,330"/>
            <path d="M560,100 C420,180 520,260 350,210"/>
          </svg>
          <span class="bc" style="left:60px;top:40px">${icon('activity', 40)}</span>
          <span class="bc" style="left:500px;top:40px">${icon('box', 40)}</span>
          <span class="bc" style="left:70px;top:280px">${icon('file', 40)}</span>
          <span class="bc" style="left:500px;top:280px">${icon('users', 40)}</span>
          <span class="bc ring" style="left:300px;top:150px">${icon('phone', 44)}</span>
        </div>
        <p class="ba-cap">4 أنظمة منفصلة · مكالمات · عقود ورقية</p>
      </div>
      <div class="ba-state ba-after">
        <div class="ba-time"><span class="num ltr c-green">&lt; 1</span><span class="u">دقيقة</span></div>
        <div class="ba-card glass">
          <img src="${BASE}assets/logo-badge.png" alt="">
          <div><span class="label">توصية واحدة موثّقة من AVYRA</span><b>الفريق المحلي</b></div>
          <span class="ba-ok">${icon('check', 34)}</span>
        </div>
        <p class="ba-cap">مصدر واحد · منطق شفاف · قرار للمهندس</p>
      </div>
    </div>
    <div class="ba-line" data-in="0" style="--d:500">
      <div class="track"><i class="solid"></i><i class="range"></i><i class="dot"></i></div>
      <div class="ticks num">${[0, 12, 24, 36, 48].map((h) => `<span style="right:${(h / 48) * 100}%">${h}${h === 48 ? ' س' : ''}</span>`).join('')}</div>
      <span class="ba-min">أقل من دقيقة</span>
    </div>
  `,
  mount(el, ctx) {
    this.btns = $$(el, '.seg button');
    this.thumb = $(el, '.seg .thumb');
    this.btns.forEach((b) => b.addEventListener('click', () => ctx.deck.go(ctx.deck.index, +b.dataset.s)));
  },
  step(s, el) {
    el.classList.toggle('is-after', s === 1);
    this.btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === s)));
    requestAnimationFrame(() => {
      const b = this.btns[s];
      const pr = b.parentElement.getBoundingClientRect(), br = b.getBoundingClientRect();
      const k = pr.width / b.parentElement.offsetWidth || 1;
      this.thumb.style.width = `${b.offsetWidth}px`;
      this.thumb.style.transform = `translateX(${(br.left - pr.left) / k - 6}px)`;
      this.thumb.style.left = '6px';
    });
  },
};
