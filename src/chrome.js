import { icon } from './icons.js';

const pad = (n) => String(n).padStart(2, '0');

export function createChrome({ root, deck, ctx }) {
  const BASE = import.meta.env.BASE_URL;
  root.innerHTML = `
    <div class="ch-brand"><img src="${BASE}assets/logo-badge.png" alt=""><span>AVYRA</span></div>
    <div class="ch-chapter"><span class="num ltr" data-k="chnum">01</span><span data-k="chname"></span></div>
    <div class="ch-progress"><i data-k="bar"></i></div>
    <div class="ch-counter"><span class="num ltr" data-k="count">01 / 17</span><span class="ch-dots" data-k="dots"></span></div>
    <nav class="ch-tools" aria-label="أدوات العرض">
      <button data-act="next" title="التالي (→)">${icon('chevL', 26)}</button>
      <button data-act="prev" title="السابق (←)">${icon('chevR', 26)}</button>
      <span class="sep"></span>
      <button data-act="assistant" title="اسأل AVYRA (A)">${icon('chat', 24)}</button>
      <button data-act="overview" title="كل الشرائح (O)">${icon('grid', 24)}</button>
      <button data-act="presenter" title="عرض المقدّم (S)">${icon('monitor', 24)}</button>
      <button data-act="fullscreen" title="ملء الشاشة (F)">${icon('maximize', 24)}</button>
      <button data-act="help" title="الاختصارات (H)">${icon('help', 24)}</button>
    </nav>
    <div class="overview" data-k="overview" role="dialog" aria-label="كل الشرائح">
      <div class="ov-head"><h3>كل الشرائح</h3><span class="small">انقر للانتقال · Esc للإغلاق</span></div>
      <div class="ov-grid" data-k="ovgrid"></div>
    </div>
    <div class="help" data-k="help" role="dialog" aria-label="اختصارات لوحة المفاتيح">
      <div class="help-card glass">
        <h3>اختصارات العرض</h3>
        <dl>
          <dt><kbd>→</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd></dt><dd>الخطوة / الشريحة التالية</dd>
          <dt><kbd>←</kbd> <kbd>PgUp</kbd></dt><dd>السابق</dd>
          <dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>البداية / النهاية</dd>
          <dt><kbd>1</kbd>…<kbd>17</kbd> ثم <kbd>Enter</kbd></dt><dd>انتقال مباشر لشريحة</dd>
          <dt><kbd>O</kbd></dt><dd>كل الشرائح</dd>
          <dt><kbd>F</kbd> <kbd>F5</kbd></dt><dd>ملء الشاشة</dd>
          <dt><kbd>A</kbd></dt><dd>اسأل AVYRA — مساعد الأسئلة</dd>
          <dt><kbd>S</kbd></dt><dd>نافذة المقدّم (ملاحظات + مؤقت)</dd>
          <dt><kbd>R</kbd></dt><dd>إعادة تشغيل الشريحة</dd>
          <dt><kbd>B</kbd> <kbd>.</kbd></dt><dd>شاشة سوداء (<kbd>Esc</kbd> للعودة)</dd>
        </dl>
      </div>
    </div>
    <div class="blackout" data-k="black"></div>
    <div class="jump num ltr" data-k="jump"></div>
  `;
  const $ = (k) => root.querySelector(`[data-k="${k}"]`);

  // Overview grid
  const grid = $('ovgrid');
  grid.innerHTML = deck.slides
    .map((s, i) => `<button class="ov-card" data-i="${i}"><span class="ov-n num ltr">${pad(i + 1)}</span><span class="ov-ch">${s.chapter || ''}</span><span class="ov-t">${s.title}</span></button>`)
    .join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.ov-card');
    if (!b) return;
    toggleOverview(false);
    deck.go(+b.dataset.i, 0);
  });

  let ovSel = 0;
  function toggleOverview(force) {
    const el = $('overview');
    const on = force ?? !el.classList.contains('show');
    el.classList.toggle('show', on);
    if (on) { ovSel = deck.index; markOv(); }
  }
  function markOv() {
    grid.querySelectorAll('.ov-card').forEach((c, i) => {
      c.classList.toggle('sel', i === ovSel);
      c.classList.toggle('cur', i === deck.index);
    });
  }
  const toggleHelp = (force) => $('help').classList.toggle('show', force ?? !$('help').classList.contains('show'));
  const toggleBlack = () => $('black').classList.toggle('show');

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
  }
  function presenter() {
    const url = `${location.pathname}?presenter${location.hash}`;
    window.open(url, 'avyra-presenter', 'width=1360,height=820');
  }

  root.querySelector('.ch-tools').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'next') deck.next();
    if (a === 'prev') deck.prev();
    if (a === 'overview') toggleOverview();
    if (a === 'help') toggleHelp();
    if (a === 'fullscreen') fullscreen();
    if (a === 'presenter') presenter();
    if (a === 'assistant') ctx.assistant?.toggle();
    b.blur();
  });

  // State → chrome
  deck.on(({ index, step, steps, total }) => {
    const s = deck.slides[index];
    $('chnum').textContent = pad(index + 1);
    $('chname').textContent = s.chapter || '';
    root.querySelector('.ch-chapter').classList.toggle('hide', !!s.hideChrome || !s.chapter);
    root.querySelector('.ch-brand').classList.toggle('hide', !!s.hideBrand);
    $('count').textContent = `${pad(index + 1)} / ${pad(total)}`;
    $('bar').style.transform = `scaleX(${(index + (steps > 1 ? step / steps : 0) + 1) / total})`;
    $('dots').innerHTML = steps > 1 ? Array.from({ length: steps }, (_, k) => `<i class="${k <= step ? 'on' : ''}"></i>`).join('') : '';
    markOv();
  });

  // Esc only closes things, one layer at a time. It never opens anything: remotes send
  // Esc for "end show", and Esc also leaves full screen — neither should pop up the slide grid.
  function escape() {
    if ($('help').classList.contains('show')) toggleHelp(false);
    else if ($('overview').classList.contains('show')) toggleOverview(false);
    else if (ctx.assistant?.isOpen()) ctx.assistant.close();
    else if ($('black').classList.contains('show')) toggleBlack();
  }
  // Moving the deck closes anything drawn over the slide (help, grid, Ask AVYRA panel).
  function navigate(dir) {
    toggleHelp(false);
    toggleOverview(false);
    if (ctx.assistant?.isOpen()) ctx.assistant.close();
    dir > 0 ? deck.next() : deck.prev();
  }

  // Presenter-remote keys always work, whatever has focus (the assistant's text field, a
  // chip inside its panel, the slide grid…). Capture phase: no panel handler can swallow them.
  //  · PgDn / PgUp — every remote's next / previous.
  //  · F5 / Shift+F5 — a remote's "start show": go full screen instead of reloading mid-talk.
  //    (Ctrl+R still reloads on purpose.)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'F5') {
      e.preventDefault(); e.stopPropagation();
      if (!document.fullscreenElement) fullscreen();
    } else if (e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault(); e.stopPropagation();
      navigate(e.key === 'PageDown' ? 1 : -1);
    }
  }, true);

  // Remote keys pressed while the speaker view has focus arrive over the deck channel
  // (next / prev / go are handled in deck.js; blank screen and Esc are chrome's).
  const remote = 'BroadcastChannel' in window ? new BroadcastChannel('avyra-deck') : null;
  remote?.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type !== 'cmd') return;
    if (m.cmd === 'black') toggleBlack();
    if (m.cmd === 'escape') escape();
  });

  // Keyboard
  let jumpBuf = '';
  let jumpT = 0;
  const showJump = () => { $('jump').textContent = jumpBuf; $('jump').classList.toggle('show', !!jumpBuf); };
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    // Only real text entry keeps the keyboard. A slider, switch or button that still has
    // focus after a mouse click must not swallow →/←/Space from the keyboard or clicker.
    const typing = t && ((t.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit|reset)$/i.test(t.type)) || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing) {
      if (e.key === 'Escape') { t.blur(); ctx.assistant?.close(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ov = $('overview').classList.contains('show');
    const code = e.code;

    if (ov) {
      const cols = 5;
      if (e.key === 'Escape' || code === 'KeyO' || code === 'KeyG') { toggleOverview(false); e.preventDefault(); return; }
      if (e.key === 'ArrowLeft') ovSel = Math.min(deck.total - 1, ovSel + 1);
      else if (e.key === 'ArrowRight') ovSel = Math.max(0, ovSel - 1);
      else if (e.key === 'ArrowDown') ovSel = Math.min(deck.total - 1, ovSel + cols);
      else if (e.key === 'ArrowUp') ovSel = Math.max(0, ovSel - cols);
      else if (e.key === 'Enter' || e.key === ' ') { toggleOverview(false); deck.go(ovSel, 0); }
      else return;
      markOv();
      e.preventDefault();
      return;
    }

    if (/^[0-9]$/.test(e.key) || /^Digit[0-9]$/.test(code)) {
      const d = /^[0-9]$/.test(e.key) ? e.key : code.slice(5);
      jumpBuf = (jumpBuf + d).slice(-2);
      clearTimeout(jumpT);
      jumpT = setTimeout(() => { jumpBuf = ''; showJump(); }, 1800);
      showJump();
      return;
    }
    if (e.key === 'Enter' && jumpBuf) {
      deck.go(parseInt(jumpBuf, 10) - 1, 0);
      jumpBuf = ''; showJump();
      e.preventDefault();
      return;
    }

    let handled = true;
    switch (true) {
      case e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey) || code === 'KeyN':
        navigate(1); break;
      case e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace' || (e.key === ' ' && e.shiftKey):
        navigate(-1); break;
      case e.key === 'Home': deck.go(0, 0); break;
      case e.key === 'End': deck.go(deck.total - 1, 0); break;
      case code === 'KeyF': fullscreen(); break;
      case code === 'KeyO' || code === 'KeyG': toggleOverview(); break;
      case e.key === 'Escape': escape(); break;
      case code === 'KeyH' || e.key === '?': toggleHelp(); break;
      case code === 'KeyB' || code === 'Period': toggleBlack(); break;
      case code === 'KeyA': ctx.assistant?.toggle(); break;
      case code === 'KeyS' || code === 'KeyP': presenter(); break;
      case code === 'KeyR': deck.replay(); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  // Touch swipe (RTL: swipe toward the right advances).
  let sx = 0, sy = 0, touching = false;
  window.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) return; touching = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!touching) return;
    touching = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (e.target.closest('input, .range, .no-swipe, .assistant')) return;
      dx > 0 ? deck.next() : deck.prev();
    }
  });

  // Idle: hide cursor + tools while presenting.
  let idleT = 0;
  const wake = () => {
    document.body.classList.remove('idle');
    root.classList.add('awake');
    clearTimeout(idleT);
    idleT = setTimeout(() => { document.body.classList.add('idle'); root.classList.remove('awake'); }, 2600);
  };
  window.addEventListener('mousemove', wake, { passive: true });
  window.addEventListener('pointerdown', wake, { passive: true });
  wake();

  return { toggleOverview, toggleHelp, fullscreen };
}
