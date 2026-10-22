// Presenter (speaker) view — opened in a second window with "S".
// Synced with the main deck over BroadcastChannel; controls it both ways.
import { icon } from './icons.js';

const pad = (n) => String(n).padStart(2, '0');

export function initPresenter(slides) {
  document.title = 'AVYRA · عرض المقدّم';
  document.body.className = 'presenter';
  document.body.innerHTML = `
    <div class="pv">
      <header class="pv-top">
        <b>AVYRA · عرض المقدّم</b>
        <span class="pv-sync" id="sync">بانتظار نافذة العرض…</span>
        <span class="pv-clock num ltr" id="clock"></span>
        <span class="pv-timer"><span class="num ltr" id="elapsed">00:00</span><button id="reset" title="إعادة المؤقت">${icon('rotate', 22)}</button></span>
      </header>
      <section class="pv-main">
        <div class="pv-cur">
          <div class="pv-meta"><span class="num ltr" id="n">--</span><span id="ch"></span><span class="pv-steps" id="steps"></span></div>
          <h1 id="title"></h1>
          <div class="pv-notes" id="notes"></div>
        </div>
        <aside class="pv-side">
          <span class="pv-lbl">التالي</span>
          <h2 id="next"></h2>
          <div class="pv-btns">
            <button id="prev">${icon('chevR', 28)} السابق</button>
            <button id="nextb" class="primary">التالي ${icon('chevL', 28)}</button>
          </div>
          <ol class="pv-list" id="list">${slides.map((s, i) => `<li data-i="${i}"><span class="num ltr">${pad(i + 1)}</span>${s.title}</li>`).join('')}</ol>
        </aside>
      </section>
    </div>`;
  const $ = (id) => document.getElementById(id);
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('avyra-deck') : null;
  const send = (cmd, extra = {}) => ch?.postMessage({ type: 'cmd', cmd, ...extra });
  let t0 = 0;

  function render(st) {
    const s = slides[st.index];
    $('sync').textContent = 'متصل';
    $('sync').classList.add('ok');
    $('n').textContent = `${pad(st.index + 1)} / ${pad(st.total)}`;
    $('ch').textContent = s.chapter || '';
    $('title').textContent = s.title;
    $('steps').innerHTML = st.steps > 1 ? `الخطوة <span class="num ltr">${st.step + 1}/${st.steps}</span>` : '';
    $('notes').textContent = s.notes || '';
    const nx = st.step < st.steps - 1 ? `${s.title} — الخطوة ${st.step + 2}` : slides[st.index + 1]?.title || '— نهاية العرض —';
    $('next').textContent = nx;
    document.querySelectorAll('#list li').forEach((li) => li.classList.toggle('cur', +li.dataset.i === st.index));
    if (!t0) t0 = Date.now();
  }
  ch?.addEventListener('message', (e) => { if (e.data?.type === 'state') render(e.data); });
  ch?.postMessage({ type: 'hello' });

  $('prev').onclick = () => send('prev');
  $('nextb').onclick = () => send('next');
  $('reset').onclick = () => { t0 = Date.now(); };
  $('list').onclick = (e) => { const li = e.target.closest('li'); if (li) send('go', { index: +li.dataset.i }); };
  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { send('next'); e.preventDefault(); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { send('prev'); e.preventDefault(); }
  });
  setInterval(() => {
    $('clock').textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (t0) { const s = Math.floor((Date.now() - t0) / 1000); $('elapsed').textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
  }, 500);
}
