// "اسأل AVYRA" — an on-stage Q&A agent for judges' questions.
// Runs fully in the browser (no backend, works offline): Arabic-aware
// normalisation + light stemming + keyword scoring over the deck's knowledge base.
import { icon } from '../icons.js';
import { KB, SUGGEST } from './kb.js';

const STOP = new Set('ما ماذا هل كيف في من على الى إلى عن هو هي هذا هذه كم لماذا متى اين أين انتم أنتم لكم لديكم عندكم يا و او أو ثم مع the a an is are what how why do does you your of to in for and or with'.split(' '));

export function norm(s) {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function stem(w) {
  if (/^[a-z0-9]+$/.test(w)) return w.replace(/(ing|es|s)$/, '');
  for (const p of ['وال', 'بال', 'فال', 'كال', 'لل', 'ال']) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  if (w.length > 4 && /^[وف]/.test(w)) w = w.slice(1);
  for (const s of ['ات', 'ون', 'ين', 'يه', 'ها', 'هم', 'كم', 'نا', 'ه', 'ي']) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
  return w;
}
const toks = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w)).map(stem);

const INDEX = KB.map((e) => ({ e, keys: new Set([...toks(e.k), ...toks(e.q)]) }));

export function answer(q) {
  const qt = toks(q);
  if (!qt.length) return null;
  let best = null, bs = 0;
  for (const it of INDEX) {
    let s = 0;
    for (const t of qt) {
      if (it.keys.has(t)) { s += 3; continue; }
      for (const k of it.keys) {
        if (t.length >= 3 && k.length >= 3 && (k.startsWith(t) || t.startsWith(k))) { s += 2; break; }
      }
    }
    if (s > bs) { bs = s; best = it.e; }
  }
  return bs >= 3 ? best : null;
}

export function createAssistant({ root, deck }) {
  const el = document.createElement('aside');
  el.className = 'assistant';
  el.setAttribute('aria-label', 'اسأل AVYRA');
  el.innerHTML = `
    <header class="as-head">
      <span class="as-orb">${icon('sparkle', 30)}</span>
      <div><b>اسأل AVYRA</b><span>مساعد العرض — يجيب من محتوى العرض</span></div>
      <button class="as-x" data-k="close" aria-label="إغلاق">${icon('close', 28)}</button>
    </header>
    <div class="as-log" data-k="log"></div>
    <div class="as-sug" data-k="sug"></div>
    <form class="as-form" data-k="form">
      <input data-k="in" type="text" autocomplete="off" placeholder="اكتب سؤالاً… مثل: كيف تربحون؟" aria-label="سؤال">
      <button class="as-send" aria-label="إرسال">${icon('send', 26)}</button>
    </form>`;
  root.appendChild(el);
  const $ = (k) => el.querySelector(`[data-k="${k}"]`);
  const log = $('log'), input = $('in');
  let open = false, typing = 0;

  const titleOf = (id) => deck.slides.find((s) => s.id === id)?.title || '';
  const indexOf = (id) => deck.slides.findIndex((s) => s.id === id);

  function chips(list) {
    $('sug').innerHTML = list.map((i) => `<button class="chip sm" data-q="${i}">${KB[i].q}</button>`).join('');
  }
  function bubble(cls, html) {
    const b = document.createElement('div');
    b.className = `as-msg ${cls}`;
    b.innerHTML = html;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }
  function reply(text, entry) {
    text = text.replace(/\$?\d[\d.,]*\s?–\s?\$?\d[\d.,]*[KMB%]?/g, (m) => `⁦${m}⁩`);
    const b = bubble('bot', '<p></p>');
    const p = b.querySelector('p');
    const id = ++typing;
    let i = 0;
    const step = () => {
      if (id !== typing) { p.textContent = text; return; }
      i = Math.min(text.length, i + 3);
      p.textContent = text.slice(0, i);
      log.scrollTop = log.scrollHeight;
      if (i < text.length) requestAnimationFrame(step);
      else if (entry) {
        const go = document.createElement('button');
        go.className = 'as-go';
        go.innerHTML = `${icon('arrowL', 22)} الشريحة <span class="num ltr">${String(indexOf(entry.slide) + 1).padStart(2, '0')}</span> · ${titleOf(entry.slide)}`;
        go.onclick = () => { api.close(); deck.go(indexOf(entry.slide), 'last'); };
        b.appendChild(go);
        log.scrollTop = log.scrollHeight;
      }
    };
    step();
  }
  function ask(q) {
    q = q.trim();
    if (!q) return;
    bubble('me', `<p></p>`).querySelector('p').textContent = q;
    input.value = '';
    const n = norm(q);
    setTimeout(() => {
      if (/^(مرحبا|اهلا|السلام|hi|hello|hey)/.test(n)) {
        reply('أهلاً بكم! اسألوني عن المشكلة، الحل، طريقة العمل، السوق، نموذج العمل، المنافسة أو خارطة الطريق.');
      } else {
        const e = answer(q);
        if (e) reply(typeof e.a === 'function' ? e.a() : e.a, e);
        else reply('هذا السؤال خارج محتوى العرض — سيجيب عنه الفريق مباشرة. جرّبوا أحد الأسئلة المقترحة.');
      }
      const pool = KB.map((_, i) => i).filter((i) => KB[i].q !== q).sort(() => Math.random() - 0.5).slice(0, 4);
      chips(pool);
    }, 260);
  }

  $('form').addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  $('sug').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) ask(KB[+b.dataset.q].q); });
  $('close').addEventListener('click', () => api.close());
  el.addEventListener('keydown', (e) => e.stopPropagation());

  const greet = () => {
    if (log.childElementCount) return;
    bubble('bot', '<p>مرحباً — أنا مساعد AVYRA. اسألني أي سؤال عن المشروع، وسأجيب من محتوى العرض وأنقلك إلى الشريحة المناسبة.</p>');
    chips(SUGGEST);
  };

  const api = {
    open() { open = true; el.classList.add('show'); greet(); setTimeout(() => input.focus(), 350); },
    close() { open = false; el.classList.remove('show'); input.blur(); },
    toggle() { open ? api.close() : api.open(); },
    isOpen: () => open,
  };
  return api;
}
