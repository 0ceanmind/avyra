import { icon } from '../icons.js';
import { AGENTS } from './s06-product.js';
import { CASES, decide, NAMES } from '../scoring.js';
import { $, $$, fmt, tweenNum, setNum } from './util.js';

const STEP_MS = [750, 950, 700, 700, 850, 750];
// Length of one full simulated run (4.7 s). A fast-forwarded run (deep link, ← from
// slide 8, → mid-run) reports this, not the few milliseconds it took to skip ahead,
// so the timer and the approval line always show the same figure as a full run.
const RUN_S = STEP_MS.reduce((a, b) => a + b, 0) / 1000;

const row = (n, name, ic) => `
  <li class="dm-a" data-i="${n - 1}">
    <span class="n num">${n}</span>
    <span class="ic">${icon(ic, 28)}</span>
    <div class="t"><b>${name}</b><span class="o"></span></div>
    <span class="st"><i class="spin"></i>${icon('check', 26)}</span>
  </li>`;

const opt = (k) => `
  <div class="dr-opt" data-o="${k}">
    <span class="nm">${NAMES[k]}</span>
    <span class="kv">${icon('clock', 22)}<b class="num" data-k="h-${k}">0</b> س</span>
    <span class="kv"><b class="num ltr" data-k="c-${k}">0</b></span>
    <div class="bar"><i data-k="b-${k}"></i></div>
    <b class="sc num" data-k="s-${k}">0</b>
  </div>`;

export default {
  id: 'demo',
  title: 'عرض حي',
  chapter: 'المنتج',
  three: 'demo',
  steps: 3,
  notes: `عرض حي (Demo Mode) — سيناريو محاكاة كامل بطائرة واحدة. كل الأرقام بيانات محاكاة.
الخطوة 1: "تحليل" — الوكلاء الستة يعملون بالتتابع، ويظهر موقع العطل على النموذج ثلاثي الأبعاد.
النتيجة: التوصية + الأسباب + التكلفة + الوقت المتوقع + البديل + درجة الثقة — خلال ثوانٍ (المؤقت يثبت أقل من 60 ثانية).
الخطوة 2: المهندس يوافق — القرار له دائماً (يمكن أيضاً الرفض أو إعادة التحليل).
بدّل إلى الحالة 2 (ATA 32) لإظهار أن النظام يوصي بالمتعاقد عندما يكون هو الأنسب — ليس منحازاً.`,
  html: () => `
    <div class="dm-head">
      <div>
        <div class="eyebrow" data-in="0">Demo Mode</div>
        <h2 class="t-m" data-in="0" style="--d:100">من البلاغ… <span class="grad">إلى القرار.</span></h2>
      </div>
      <div class="dm-meta" data-in="0" style="--d:200">
        <span class="badge-sim">${icon('alert')} محاكاة · Simulation</span>
        <span class="dm-timer" data-k="timerbox">${icon('clock', 26)}<span class="num ltr" data-k="timer">0.0</span><span>ث</span></span>
      </div>
    </div>
    <div class="dm-right">
      <div class="dm-case glass" data-in="0" style="--d:250">
        <div class="dm-case-top">
          <span class="label">معرّف الطائرة</span>
          <div class="dm-tabs">${CASES.map((c, i) => `<button data-case="${i}" aria-pressed="${i === 0}" title="الحالة ${i + 1}"><span class="ltr">${c.tag}</span></button>`).join('')}</div>
        </div>
        <div class="dm-row">
          <div class="dm-input"><span class="mono ltr" data-k="id">${CASES[0].id}</span><i class="caret"></i></div>
          <button class="btn go dm-run" data-k="run">${icon('play', 26)} تحليل</button>
        </div>
      </div>
      <ol class="dm-agents" data-k="agents" data-in="0" style="--d:350">
        ${AGENTS.map((a, i) => row(i + 1, a.name, a.ic)).join('')}
        ${row(7, 'موافقة المهندس', 'userCheck')}
      </ol>
    </div>
    <div class="dm-result glass" data-k="result">
      <div class="dr-head">
        <div class="dr-title"><span class="label">التوصية <span class="dr-sim">محاكاة</span></span><b data-k="win">—</b></div>
        <div class="dr-conf">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="p" cx="60" cy="60" r="52" pathLength="100" data-k="confarc"/></svg>
          <div><b class="num ltr" data-k="conf">0%</b><span class="small">الثقة</span></div>
        </div>
      </div>
      <div class="dr-cmp">${opt('team')}${opt('mro')}</div>
      <div class="dr-why" data-k="why"></div>
      <div class="dr-foot">
        <span class="dr-alt" data-k="alt"></span>
        <div class="dr-act">
          <button class="btn ok" data-act="ok">${icon('check', 26)} موافقة</button>
          <button class="btn no" data-act="no">${icon('x', 26)} رفض</button>
          <button class="btn" data-act="re">${icon('rotate', 26)} إعادة تحليل</button>
        </div>
      </div>
      <div class="dr-stamp" data-k="stamp">${icon('userCheck', 30)} <span data-k="stamptxt">اعتمد المهندس</span></div>
    </div>
    <div class="dm-idle" data-k="idle">${icon('plane', 30)}<span>اختر حالة ثم اضغط <b>تحليل</b></span></div>
  `,

  mount(el, ctx) {
    this.el = el;
    this.ctx = ctx;
    this.ci = 0;
    this.token = 0;
    this.rows = $$(el, '.dm-a');
    this.k = (n) => $(el, `[data-k="${n}"]`);
    $$(el, '.dm-tabs button').forEach((b) =>
      b.addEventListener('click', () => {
        if (+b.dataset.case === this.ci && !this.done && !this.running) return;
        this.ci = +b.dataset.case;
        $$(el, '.dm-tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        this.typeId(CASES[this.ci].id);
        this.reset();
        if (ctx.deck.step !== 0) ctx.deck.go(ctx.deck.index, 0);
      })
    );
    this.k('run').addEventListener('click', () => {
      if (ctx.deck.step !== 1) ctx.deck.go(ctx.deck.index, 1);
      else this.run();
    });
    $(el, '.dr-act').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'ok') ctx.deck.go(ctx.deck.index, 2);
      if (b.dataset.act === 'no') this.reject();
      if (b.dataset.act === 're') { if (ctx.deck.step !== 1) ctx.deck.go(ctx.deck.index, 1); this.run(); }
    });
  },

  typeId(id) {
    const el = this.k('id');
    clearInterval(this._typeT);
    let i = 0;
    el.textContent = '';
    this._typeT = setInterval(() => {
      el.textContent = id.slice(0, ++i);
      if (i >= id.length) clearInterval(this._typeT);
    }, 55);
  },

  sleep(ms, token) {
    return new Promise((res) => {
      const t0 = performance.now();
      const f = () => {
        if (this.fast || token !== this.token || performance.now() - t0 >= ms) res();
        else setTimeout(f, 25);
      };
      f();
    });
  },

  setRow(i, state, out) {
    const r = this.rows[i];
    r.dataset.state = state;
    if (out !== undefined) $(r, '.o').textContent = out;
  },

  startTimer() {
    this.t0 = performance.now();
    cancelAnimationFrame(this._raf);
    const t = this.k('timer');
    this.k('timerbox').classList.add('live');
    const f = () => {
      t.textContent = ((performance.now() - this.t0) / 1000).toFixed(1);
      this._raf = requestAnimationFrame(f);
    };
    f();
  },
  stopTimer() {
    cancelAnimationFrame(this._raf);
    this.k('timerbox').classList.remove('live');
    this.elapsed = Math.max(RUN_S, (performance.now() - this.t0) / 1000).toFixed(1);
    this.k('timer').textContent = this.elapsed;
  },

  reset() {
    this.token++;
    this.running = false;
    this.done = false;
    this.fast = false;
    cancelAnimationFrame(this._raf);
    this.k('timerbox').classList.remove('live');
    this.k('timer').textContent = '0.0';
    this.rows.forEach((r) => { r.dataset.state = ''; $(r, '.o').textContent = ''; });
    this.k('agents').classList.remove('sum');
    const res = this.k('result');
    res.classList.remove('show', 'cmp', 'approved', 'rejected');
    this.k('idle').classList.add('show');
    const st = this.ctx.stage3d;
    st.setMarker(null);
    st.setScan(false);
    st.setHolo(0, 0.6);
  },

  async run() {
    this.reset();
    const token = this.token;
    const c = CASES[this.ci];
    const r = decide(c.team, c.mro);
    const st = this.ctx.stage3d;
    this.running = true;
    this.k('idle').classList.remove('show');
    this.startTimer();
    for (let i = 0; i < 6; i++) {
      this.setRow(i, 'run');
      if (i === 1) { st.setHolo(0.92, 0.6); st.setScan(true); }
      await this.sleep(STEP_MS[i], token);
      if (token !== this.token) return;
      this.setRow(i, 'done', i < 5 ? c.out[i] : `${NAMES[r.winner]} · ثقة ${r.confidence}%`);
      if (i === 0) st.setMarker(c.point, `<b class="ltr">${c.tag}</b> ${c.fault}`, 'red');
      if (i === 1) { st.setScan(false); st.setHolo(0, 0.9); }
      if (i === 4) this.showCompare(r, c);
    }
    this.setRow(6, 'wait', 'بانتظار موافقة المهندس');
    this.stopTimer();
    this.showResult(r, c);
    this.running = false;
    this.done = true;
    this.r = r;
  },

  showCompare(r, c) {
    const res = this.k('result');
    res.classList.add('show', 'cmp');
    for (const k of ['team', 'mro']) {
      tweenNum(this.k(`h-${k}`), c[k].hours, { duration: 0.8 });
      tweenNum(this.k(`c-${k}`), c[k].cost, { duration: 0.8, format: (v) => '$' + fmt(Math.round(v / 100) * 100) });
      tweenNum(this.k(`s-${k}`), r[k].total, { duration: 0.9 });
      this.k(`b-${k}`).style.width = `${r[k].total}%`;
      $(res, `[data-o="${k}"]`).classList.toggle('win', r.winner === k);
    }
    this.k('win').textContent = '…';
  },

  showResult(r, c) {
    // The recommendation now carries the message: agent outputs fold away (hover a row to
    // see its output again), leaving six ticks and the approval line.
    this.k('agents').classList.add('sum');
    const res = this.k('result');
    res.classList.add('show');
    res.classList.remove('cmp');
    this.k('win').textContent = NAMES[r.winner];
    this.k('confarc').style.strokeDashoffset = String(100 - r.confidence);
    tweenNum(this.k('conf'), r.confidence, { duration: 1, format: (v) => Math.round(v) + '%' });
    this.k('why').innerHTML = c.reasons.map((t) => `<span class="chip sm">${icon('check')} ${t}</span>`).join('');
    this.k('alt').innerHTML = `<span class="muted">البديل:</span> ${c.alt}`;
  },

  approve() {
    const res = this.k('result');
    res.classList.remove('rejected');
    res.classList.add('approved');
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    this.k('stamptxt').innerHTML = `اعتمد المهندس · <span class="num ltr">${time}</span>`;
    this.setRow(6, 'done', 'اعتُمد · سُجّل في سجل التدقيق'); // the time is on the timer
    this.ctx.stage3d.setMarkerTone('cyan');
  },
  unapprove() {
    this.k('result').classList.remove('approved', 'rejected');
    this.setRow(6, 'wait', 'بانتظار موافقة المهندس');
    this.ctx.stage3d.setMarkerTone('red');
  },
  reject() {
    if (!this.done) return;
    const res = this.k('result');
    res.classList.remove('approved');
    res.classList.add('rejected');
    this.setRow(6, 'rej', 'رُفضت التوصية — سُجّل السبب للتدقيق');
  },

  // Jumping straight to the approved step (deep link #/7/2, or ← from slide 8)
  // fast-forwards the run. run() starts with reset(), which clears `fast`, so the
  // flag is set after starting it. Stops waiting if the run is aborted (slide left).
  async complete() {
    if (this.done) return;
    if (!this.running) this.run();
    this.fast = true;
    while (!this.done && this.running) await new Promise((r) => setTimeout(r, 25));
  },

  intercept(dir) {
    if (dir === 'next' && this.running) { this.fast = true; return true; }
    return false;
  },

  enter() { this.reset(); this.k('idle').classList.add('show'); },
  async step(s, el, ctx, dir) {
    if (s === 0) { this.reset(); return; }
    if (s === 1) {
      if (dir < 0 && this.done) { this.unapprove(); return; }
      if (!this.done && !this.running) this.run();
      return;
    }
    if (s === 2) {
      await this.complete();
      if (ctx.deck.index === ctx.deck.slides.indexOf(this) && ctx.deck.step === 2) this.approve();
    }
  },
  leave() {
    this.reset();
  },
};
