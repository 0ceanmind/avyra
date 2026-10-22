// "اسأل AVYRA" — an on-stage Q&A agent for judges' questions.
// Runs fully in the browser (no backend, works offline): Arabic-aware
// normalisation + light stemming + keyword scoring over the deck's knowledge base.
import { icon } from '../icons.js';
import { KB, SUGGEST } from './kb.js';

// Function words carry no topic (normalised spelling: hamza seats and ى folded, as norm() does).
const STOP = new Set(('ما ماذا هل كيف في من على الى عن هو هي هم هذا هذه ذلك تلك الذي التي كم لماذا اين ' +
  'انتم نحن لكم لنا لديكم عندكم يا و او ثم مع اذا لو ان قد كل بين عند بعد قبل حتى ' +
  'the a an is are was what how why do does did you your we our of to in on for and or with it its be will can').split(' '));

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
const PRON = ['تم', 'كم', 'هم', 'ها', 'نا', 'ه', 'ي']; // جربتم · منافسوكم · شركاؤهم · خطتنا …
const PLUR = ['ات', 'ون', 'ين', 'يه'];
function stem(w) {
  if (/^[a-z0-9]+$/.test(w)) return w.replace(/(ing|es|s)$/, '');
  for (const p of ['وال', 'بال', 'فال', 'كال', 'لل', 'ال']) if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
  if (w.length > 4 && /^[وف]/.test(w)) w = w.slice(1);
  const cut = (list) => { for (const s of list) if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); return true; } return false; };
  if (cut(PRON)) { if (w.length >= 4 && w.endsWith('و')) w = w.slice(0, -1); } // منافسو(كم) → منافس, شركاو(كم) → شركا
  else cut(PLUR);
  return w.replace(/اء$/, 'ا'); // شركاء → شركا, أخطاء → اخطا (same form as the inflected words above)
}
const toks = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w)).map(stem);

// Curated keywords (k) are strong evidence; words that only occur in an entry's question
// text are weak (they are often generic: «النظام», «حجم», «حقيقي»). A word shared by many
// entries counts for less than one that points at a single entry.
const INDEX = KB.map((e) => ({ e, q: norm(e.q), kw: new Set(toks(e.k)), qw: new Set(toks(e.q)) }));
const DF = new Map();
for (const it of INDEX) for (const t of new Set([...it.kw, ...it.qw])) DF.set(t, (DF.get(t) || 0) + 1);

function score(it, qt) {
  let s = 0;
  for (const t of qt) {
    const df = DF.get(t) || 1;
    // Curated keyword: 4 if unique to this entry, 3 if shared by two…; +0.5 if the entry's
    // own question uses the word too («AOG» → the AOG-meaning entry, not the AOG-cost one).
    if (it.kw.has(t)) { s += 2 + 2 / df + (it.qw.has(t) ? 0.5 : 0); continue; }
    if (it.qw.has(t)) { s += 1 / df; continue; }
    if (t.length >= 3) for (const k of it.kw) if (k.length >= 3 && (k.startsWith(t) || t.startsWith(k))) { s += 1.5; break; }
  }
  return s;
}
// All entries with any evidence, best first (stable: ties keep knowledge-base order).
export function rank(q) {
  const qt = toks(q);
  if (!qt.length) return [];
  return INDEX.map((it) => ({ e: it.e, s: score(it, qt) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
}
export function answer(q) {
  // A suggested question (or the same words typed) always opens its own answer.
  const nq = norm(q);
  const exact = INDEX.find((it) => it.q === nq);
  if (exact) return exact.e;
  // Needs one keyword that points at this entry (or several weaker hints). Otherwise the
  // reply is "outside the deck" with the nearest questions offered as chips: in front of
  // judges a wrong answer with a slide link is worse than "the team will answer that".
  const [best] = rank(q);
  return best && best.s >= 3.5 ? best.e : null;
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
    const t0 = performance.now();
    const step = () => {
      if (id !== typing) { p.textContent = text; return; }
      // Time-based typing (~180 chars/s, as before at 60 fps) so a busy GPU
      // (4K screen + 3D slide behind the panel) cannot slow the answer down.
      i = Math.min(text.length, Math.max(i + 3, Math.round((performance.now() - t0) * 0.18)));
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
      let near = [], shown = null;
      if (/^(مرحبا|اهلا|السلام|hi|hello|hey)( |$)/.test(n)) {
        reply('أهلاً بكم! اسألوني عن المشكلة، الحل، طريقة العمل، السوق، نموذج العمل، المنافسة أو خارطة الطريق.');
      } else {
        const e = answer(q);
        if (e) reply(typeof e.a === 'function' ? e.a() : e.a, e);
        else reply('هذا السؤال خارج محتوى العرض — سيجيب عنه الفريق مباشرة. جرّبوا أحد الأسئلة المقترحة.');
        // Near misses go first among the suggestion chips, one tap away: the runner-up when
        // it scored almost as well, or the two closest entries when nothing was certain enough.
        const r = rank(q), others = r.filter((x) => x.e !== e);
        near = (e ? others.filter((x) => x.s >= 3 && x.s >= 0.75 * r[0].s).slice(0, 1) : others.filter((x) => x.s >= 1.5).slice(0, 2)).map((x) => KB.indexOf(x.e));
        shown = e;
      }
      const rest = KB.map((_, i) => i).filter((i) => KB[i].q !== q && KB[i] !== shown && !near.includes(i)).sort(() => Math.random() - 0.5);
      chips([...near, ...rest].slice(0, 4));
    }, 260);
  }

  $('form').addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  $('sug').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) ask(KB[+b.dataset.q].q); });
  $('close').addEventListener('click', () => api.close());
  // Typing stays in the text field (← / → move the caret there); Esc closes the panel.
  // Every other key — e.g. → or Space after clicking a suggestion chip — reaches the deck.
  // (PgDn / PgUp / F5 from a remote are handled before this, in chrome.js.)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(); return; }
    if (e.target === input) e.stopPropagation();
  });

  const greet = () => {
    if (log.childElementCount) return;
    bubble('bot', '<p>مرحباً — أنا مساعد AVYRA. اسألني أي سؤال عن المشروع، وسأجيب من محتوى العرض وأنقلك إلى الشريحة المناسبة.</p>');
    chips(SUGGEST);
  };

  const api = {
    open() { open = true; el.classList.add('show'); greet(); setTimeout(() => input.focus(), 350); },
    // Give focus back to the page: a focused button left inside the hidden panel
    // would otherwise keep receiving (and swallowing) the presenter's → / ← keys.
    close() { open = false; el.classList.remove('show'); if (el.contains(document.activeElement)) document.activeElement.blur(); },
    toggle() { open ? api.close() : api.open(); },
    isOpen: () => open,
  };
  return api;
}
