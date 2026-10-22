// Pre-show acceptance check for the AVYRA deck: drives the built site in headless
// Chrome like a presenter would and audits every slide/step.
// usage: npm run qa      (= vite build && node scripts/qa/deck-check.mjs dist .qa)
// Screenshots of every state land in .qa/ — flick through them before the event.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { serve, launch } from './cdp.mjs';

const [dist = 'dist', out = '.qa', portArg] = process.argv.slice(2);
const port = +(portArg || 4801);
fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.resolve(dist), port);
const b = await launch({ port: port + 1000, profile: path.resolve(out, 'profile') });
const URL0 = `http://127.0.0.1:${port}/`;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

// In-page audit of everything visible on the current slide + chrome.
const AUDIT = `(() => {
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect(); const k = sr.width / 1920;
  const roots = [document.querySelector('.slide.active'), document.getElementById('chrome'), document.getElementById('overlay3d'), document.querySelector('.assistant')];
  const eff = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return o; };
  const items = [];
  for (const root of roots) {
    if (!root) continue;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode; const t = n.nodeValue.replace(/[\\u2066-\\u2069]/g, '').replace(/\\s+/g, ' ').trim();
      if (!t) continue;
      const el = n.parentElement;
      if (el.closest('style,script')) continue;
      if (eff(el) < 0.15) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      const rb = r.getBoundingClientRect();
      if (rb.width < 1 || rb.height < 1) continue;
      let fs = parseFloat(getComputedStyle(el).fontSize);
      const svg = el.closest('svg');
      if (svg && el.ownerSVGElement) { const m = el.getScreenCTM(); fs = fs * Math.hypot(m.a, m.b) / k; }
      items.push({ t, el, fs, rb, cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || el.tagName });
    }
  }
  const small = items.filter((i) => i.fs < 21.5).map((i) => i.fs.toFixed(1) + 'px ' + i.cls + ' «' + i.t.slice(0, 40) + '»');
  const clipped = [];
  for (const i of items) {
    for (let e = i.el; e && e !== stage; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if ((cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 2 && !e.matches('.as-log, .mt-zone, .lg-track, .bar, .dr-opt .bar')) { clipped.push(i.cls + ' «' + i.t.slice(0, 50) + '» sw=' + e.scrollWidth + ' cw=' + e.clientWidth); break; }
    }
  }
  const clipRect = (el) => { for (let e = el.parentElement; e && e !== stage; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' && cs.overflowX !== undefined && !(e instanceof SVGElement)) return e.getBoundingClientRect(); } return null; };
  for (const i of items) { const c = clipRect(i.el); if (c && (i.rb.right < c.left || i.rb.left > c.right || i.rb.bottom < c.top || i.rb.top > c.bottom)) i.hidden = true; }
  const off = items.filter((i) => !i.hidden && (i.rb.left < sr.left - 2 || i.rb.right > sr.right + 2 || i.rb.top < sr.top - 2 || i.rb.bottom > sr.bottom + 2)).map((i) => i.cls + ' «' + i.t.slice(0, 30) + '»');
  const overlaps = [];
  for (let a = 0; a < items.length; a++) for (let c = a + 1; c < items.length; c++) {
    const A = items[a], B = items[c];
    if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
    const x = Math.max(0, Math.min(A.rb.right, B.rb.right) - Math.max(A.rb.left, B.rb.left));
    const y = Math.max(0, Math.min(A.rb.bottom, B.rb.bottom) - Math.max(A.rb.top, B.rb.top));
    const ar = Math.min(A.rb.width * A.rb.height, B.rb.width * B.rb.height);
    if (x * y > 0.25 * ar) overlaps.push('«' + A.t.slice(0, 24) + '» × «' + B.t.slice(0, 24) + '»');
  }
  const escaped = [];
  for (const i of items) {
    const g = i.el.closest('.slide .glass');
    if (!g || i.hidden || i.el.closest('.dr-stamp')) continue; // the approval stamp overlaps the card edge by design
    const r = g.getBoundingClientRect();
    if (i.rb.left < r.left - 2 || i.rb.right > r.right + 2 || i.rb.top < r.top - 2 || i.rb.bottom > r.bottom + 2) escaped.push(i.cls + ' «' + i.t.slice(0, 30) + '»');
  }
  const mk = document.querySelector('.mk.show .mk-label');
  if (mk && eff(mk) > 0.15) {
    const m = mk.getBoundingClientRect();
    for (const g of document.querySelectorAll('.slide.active .glass')) {
      if (eff(g) < 0.15) continue;
      const r = g.getBoundingClientRect();
      if (Math.min(m.right, r.right) - Math.max(m.left, r.left) > 2 && Math.min(m.bottom, r.bottom) - Math.max(m.top, r.top) > 2) escaped.push('3D label «' + mk.textContent.slice(0, 30) + '» over panel ' + g.className);
    }
  }
  const slideItems = items.filter((i) => i.el.closest('.slide'));
  const words = slideItems.map((i) => i.t).join(' ').split(/\\s+/).filter((w) => /[\\p{L}\\p{N}]/u.test(w)).length;
  return { idx: __deck.index, step: __deck.step, words, small, clipped, off, overlaps, escaped, minFs: Math.min(...items.map((i) => i.fs)) };
})()`;

const st = () => b.eval('[__deck.index, __deck.step]');
// After a key that may have reloaded the page (F5 on an unpatched deck), wait until it is back.
const reboot = async () => { for (let i = 0; i < 80; i++) { try { if (await b.eval('!!window.__deck && document.getElementById("boot").classList.contains("done")')) return; } catch {} await b.sleep(250); } };
const errs0 = () => b.errors.length;

// ── F1: walk every slide/step with the keyboard, audit each state ─────────────
await b.goto(URL0 + '#/1');
const audits = [];
for (let guard = 0; guard < 60; guard++) {
  const [i, s] = await st();
  await b.sleep(i === 16 ? 4600 : i === 6 && s === 1 ? 6500 : 2600);
  const a = await b.eval(AUDIT);
  audits.push(a);
  await b.shot(path.join(out, `s${String(i + 1).padStart(2, '0')}-${s}.png`));
  const before = JSON.stringify(await st());
  await b.right();
  await b.sleep(150);
  if (JSON.stringify(await st()) === before) break;
}
const lastState = await st();
check('F1 keyboard walk reaches slide 17', lastState[0] === 16, `states visited=${audits.length}`);
check('F1 no console errors/warnings during walk', b.errors.length === 0, b.errors.slice(0, 5).join(' | '));
const allSmall = audits.flatMap((a) => a.small.map((s) => `#${a.idx + 1}/${a.step} ${s}`));
check('T3 no visible text below 22 design px', allSmall.length === 0, `${allSmall.length} nodes`);
fs.writeFileSync(path.join(out, 'small.txt'), [...new Set(allSmall)].join('\n'));
const allClip = audits.flatMap((a) => a.clipped.map((s) => `#${a.idx + 1}/${a.step} ${s}`));
check('T4a no clipped/ellipsised visible text', allClip.length === 0, [...new Set(allClip)].slice(0, 6).join(' | '));
const allOff = audits.flatMap((a) => a.off.map((s) => `#${a.idx + 1}/${a.step} ${s}`));
check('T4b no visible text outside the 1920×1080 stage', allOff.length === 0, allOff.slice(0, 4).join(' | '));
const allOv = audits.flatMap((a) => a.overlaps.map((s) => `#${a.idx + 1}/${a.step} ${s}`));
check('T4c no overlapping text boxes', allOv.length === 0, [...new Set(allOv)].slice(0, 6).join(' | '));
const allEsc = audits.flatMap((a) => a.escaped.map((s) => `#${a.idx + 1}/${a.step} ${s}`));
check('T4d text stays inside its card; 3D fault label never covers a panel', allEsc.length === 0, [...new Set(allEsc)].slice(0, 6).join(' | '));
const perSlide = {};
for (const a of audits) perSlide[a.idx + 1] = Math.max(perSlide[a.idx + 1] || 0, a.words);
fs.writeFileSync(path.join(out, 'words.json'), JSON.stringify(perSlide, null, 1));
console.log('words per slide (max over steps):', JSON.stringify(perSlide));
// Every slide is measured at every step. Budget: 50 words (a title + a few keywords or
// short bullets); the live demo, which is the product's own screen, gets 90.
const BUDGET = (n) => (n === '7' ? 90 : 50);
const over = Object.entries(perSlide).filter(([n, w]) => w > BUDGET(n));
check('T5 visible words per slide ≤ 50 (live demo #7 ≤ 90), every slide and step', over.length === 0, over.map(([n, w]) => `#${n}:${w}`).join(' '));

// ── F2: after dragging a range slider, → must still advance the deck ─────────
await b.goto(URL0 + '#/3');
await b.sleep(1500);
await b.clickSel('.slide-cost .cs-slider input');
await b.sleep(200);
const f2a = await st();
await b.right();
await b.sleep(300);
const f2b = await st();
check('F2 → advances after using the cost slider', JSON.stringify(f2a) !== JSON.stringify(f2b), `${f2a} → ${f2b}`);

// ── F3: assistant answer → "go to slide" link → → must still advance ────────
await b.goto(URL0 + '#/4');
await b.sleep(800);
await b.key('a', 'KeyA', 65, { text: 'a' });
await b.sleep(600);
await b.type('ما حجم السوق');
await b.key('Enter', 'Enter', 13, { text: '\r' });
for (let i = 0; i < 160 && !(await b.eval("!!document.querySelector('.as-msg.bot:last-child .as-go')")); i++) await b.sleep(250);
await b.clickSel('.as-msg.bot:last-child .as-go');
await b.sleep(700);
const f3a = await st();
await b.right();
await b.sleep(300);
const f3b = await st();
check('F3 assistant link jumps to market slide', f3a[0] === 8, `${f3a}`);
check('F3 → advances after using the assistant link', JSON.stringify(f3a) !== JSON.stringify(f3b), `${f3a} → ${f3b}`);

// ── F3c: Esc closes the assistant while its text field has focus; → works afterwards ──
await b.key('a', 'KeyA', 65, { text: 'a' });
await b.sleep(700);
const typingFocus = await b.eval("document.activeElement.tagName === 'INPUT'");
await b.key('Escape', 'Escape', 27);
await b.sleep(400);
const asOpen = await b.eval("document.querySelector('.assistant').classList.contains('show')");
check('F3c Esc closes the assistant while typing', typingFocus && !asOpen, `focusInInput=${typingFocus} open=${asOpen}`);
const f3c = await st();
await b.right();
await b.sleep(300);
check('F3d → advances after closing the assistant with Esc', JSON.stringify(f3c) !== JSON.stringify(await st()));

// ── F4: Space after clicking an on-slide button advances exactly once ──────
await b.goto(URL0 + '#/5');
await b.sleep(1500);
await b.clickSel('.slide-beforeafter .seg button[data-s="1"]');
await b.sleep(400);
const f4a = await st();
await b.space();
await b.sleep(400);
const f4b = await st();
check('F4 Space after clicking a button advances to next slide', f4a[0] === 4 && f4a[1] === 1 && f4b[0] === 5 && f4b[1] === 0, `${f4a} → ${f4b}`);

// ── F5: demo case 2 recommends the contractor ──────────────────────────────
await b.goto(URL0 + '#/7');
await b.sleep(1500);
await b.clickSel('.slide-demo .dm-tabs button[data-case="1"]');
await b.sleep(900);
await b.clickSel('.slide-demo [data-k="run"]');
await b.sleep(7000);
const win2 = await b.eval("document.querySelector('.slide-demo [data-k=win]').textContent");
const a2 = await b.eval(AUDIT);
check('F5b demo case 2: no escaped/small/clipped/overlapping text', !a2.escaped.length && !a2.small.length && !a2.clipped.length && !a2.overlaps.length, [...a2.escaped, ...a2.small, ...a2.clipped, ...a2.overlaps].slice(0, 4).join(' | '));
check('F5 demo case 2 → MRO المتعاقد', win2 === 'MRO المتعاقد', win2);
await b.shot(path.join(out, 'f5-case2.png'));

// ── F6: deep link restores approved demo state ─────────────────────────────
await b.goto(URL0 + '#/7/2');
await b.sleep(2500);
const demoState = () => b.eval(`(() => { const q = (s) => document.querySelector('.slide-demo ' + s);
  return { approved: q('[data-k=result]').classList.contains('approved'), timer: parseFloat(q('[data-k=timer]').textContent), row7: q('.dm-a[data-i="6"] .o').textContent }; })()`);
const f6 = await demoState();
check('F6 #/7/2 deep link renders the approved state with the full-run time (not 0.0 s)', f6.approved && f6.timer >= 4.7 && /اعتُمد/.test(f6.row7), JSON.stringify(f6));
await b.goto(URL0 + '#/8');
await b.sleep(1200);
await b.left();
await b.sleep(1500);
const f6b = await demoState();
check('F6b ← from slide 8 shows the approved demo at once, timer ≥ 4.7 s', JSON.stringify(await st()) === '[6,2]' && f6b.approved && f6b.timer >= 4.7 && /اعتُمد/.test(f6b.row7), JSON.stringify(f6b));

// ── F7: every slide reachable by hash, no errors ───────────────────────────
const e0 = b.errors.length;
for (let i = 1; i <= 17; i++) { await b.eval(`location.hash = '#/${i}'`); await b.sleep(250); }
const okIdx = await b.eval('__deck.index');
check('F7 hash routing to all 17 slides without errors', okIdx === 16 && b.errors.length === e0, b.errors.slice(e0).join(' | '));

// ── F8: adaptive 3D resolution (driven through its frame-time logic) ──────
await b.goto(URL0 + '#/1');
await b.sleep(1500);
const hasPerf = await b.eval("!!(window.__stage3d && window.__stage3d.perf)");
if (hasPerf) {
  // Each scenario starts at a given screen resolution, then feeds blocks of 90 frames
  // (30 warm-up + one 60-frame window) at the given frame time in seconds.
  const run = (pr, blocks) => b.eval(`(() => { const s = __stage3d; const H = document.documentElement;
    H.classList.remove('lowfx'); s._perf = { skip: 0, samples: [], trial: null, locked: false };
    s.prCap = 0; s.pr = 0; s.maxPR = ${pr}; s.applyPR(${pr});
    const out = [];
    for (const [dt, n] of ${JSON.stringify(blocks)}) { for (let i = 0; i < n * 90; i++) s.perf(dt); out.push(s.pr); }
    out.push(H.classList.contains('lowfx')); H.classList.remove('lowfx');
    s._perf = { skip: 0, samples: [], trial: null, locked: false }; s.prCap = 0; s.applyPR(s.maxPR = 1);
    return out; })()`);
  const weak1080 = await run(1, [[0.040, 1], [0.020, 1], [0.020, 3]]);
  check('F8a 1080p, weak GPU: 1× → 0.75×, kept once frames recover', JSON.stringify(weak1080) === '[0.75,0.75,0.75,false]', JSON.stringify(weak1080));
  const floor = await run(1, [[0.040, 1], [0.030, 1], [0.030, 1]]);
  check('F8b still slow at 0.75×: backdrop blur switched off (lowfx), never below 0.75×', floor[2] === 0.75 && floor[3] === true, JSON.stringify(floor));
  const tv30 = await run(2, [[0.0333, 1], [0.0333, 1], [0.0333, 20]]);
  check('F8c 30 Hz display (frame time not resolution-bound): step undone, stays sharp at 2×', JSON.stringify(tv30) === '[1.75,2,2,false]', JSON.stringify(tv30));
  const weak4k = await run(2, [[0.050, 1], [0.040, 1], [0.030, 1], [0.020, 3]]);
  check('F8d 4K, weak GPU: 2× → 1.75× → 1.5× → 1.25×, then stable', JSON.stringify(weak4k) === '[1.75,1.5,1.25,1.25,false]', JSON.stringify(weak4k));
} else check('F8 adaptive pixel ratio present', false, 'no __stage3d.perf');

// ── F9: accuracy checks on rendered content ────────────────────────────────
const txt = (sel) => b.eval(`[...document.querySelectorAll(${JSON.stringify(sel)})].map((e) => e.textContent).join(' ')`);
const s4 = await txt('.slide-solution'), s5 = await txt('.slide-beforeafter');
check('F9a no unlabelled simulated confidence (82%) on slides 4–5', !/82/.test(s4) && !/82/.test(s5));
const s12 = await txt('.slide-validation');
check('F9b validation slide: no invented quotation, persona wording from the deck', !/[«»]/.test(s12) && /مدير MRO/.test(s12));
const s13 = await txt('.slide-roadmap');
check('F9c roadmap 6–12 months = pilot, not "first customer"', /عميل تجريبي/.test(s13) && !/عميل أوّل/.test(s13));
const res = await txt('.slide-demo .dm-result');
check('F9d demo recommendation card carries a simulation label', /محاكاة/.test(res));
await b.key('a', 'KeyA', 65, { text: 'a' });
await b.sleep(700);
await b.type('من هو الفريق');
await b.key('Enter', 'Enter', 13, { text: String.fromCharCode(13) });
await b.sleep(400);
const teamAns = await b.eval(`(async () => { for (let i = 0; i < 80; i++) { const t = [...document.querySelectorAll('.as-msg.bot')].pop().textContent; if (document.querySelector('.as-msg.bot:last-child .as-go')) return t; await new Promise((r) => setTimeout(r, 200)); } return [...document.querySelectorAll('.as-msg.bot')].pop().textContent; })()`);
check('F9e "who is the team" gets the team answer, with only config facts', /فريق AVYRA/.test(teamAns) && !/يجمع الطيران|عاشها/.test(teamAns), teamAns.slice(0, 90));

const s15 = await txt('.slide-ask');
check('F9f runway placeholder «[12-18]» is not shown as a fact on slide 15', !/12–18|18–12|12-18/.test(s15), s15.replace(/\s+/g, ' ').slice(0, 80));

// ── F10: a remote's F5 must not reload the page; Esc alone must not open the grid ──
await b.goto(URL0 + '#/9');
await b.sleep(800);
await b.eval('window.__mark = 1');
await b.key('F5', 'F5', 116);
await b.sleep(2500);
await reboot();
check('F10 F5 (presenter remote "start") does not reload the deck', (await b.eval('window.__mark || 0')) === 1);
await b.goto(URL0 + '#/9');
await b.sleep(1200);
await b.key('Escape', 'Escape', 27);
await b.sleep(400);
check('F11 Esc with nothing open leaves the slide on screen (no overview pop-up)', !(await b.eval("document.querySelector('.overview').classList.contains('show')")));

// ── F13: remote keys work whatever is open or focused ────────────────────────
const asOpenNow = () => b.eval("document.querySelector('.assistant').classList.contains('show')");
await b.goto(URL0 + '#/4');
await b.sleep(1000);
await b.key('a', 'KeyA', 65, { text: 'a' });
await b.sleep(700);
await b.eval('window.__mark = 2');
const a0 = await st();
await b.key('F5', 'F5', 116);
await b.sleep(1500);
await reboot();
const f13a = { mark: await b.eval('window.__mark || 0'), focus: await b.eval('document.activeElement.tagName') };
await b.key('PageDown', 'PageDown', 34);
await b.sleep(400);
const a1 = await st();
check('F13a Ask AVYRA open, typing: F5 does not reload; PgDn advances and closes the panel', f13a.mark === 2 && f13a.focus === 'INPUT' && JSON.stringify(a0) !== JSON.stringify(a1) && !(await asOpenNow()), JSON.stringify({ ...f13a, a0, a1 }));
await b.key('a', 'KeyA', 65, { text: 'a' });
await b.sleep(700);
await b.clickSel('.as-sug [data-q]');
await b.sleep(80); // before the chips are re-drawn: focus is on the clicked chip
const chipFocus = await b.eval("!!document.activeElement.closest('.as-sug')");
const c0 = await st();
await b.right();
await b.sleep(400);
const c1 = await st();
check('F13b → advances the deck right after clicking a suggestion chip', chipFocus && JSON.stringify(c0) !== JSON.stringify(c1) && !(await asOpenNow()), JSON.stringify({ chipFocus, c0, c1 }));
await b.goto(URL0 + '#/9');
await b.sleep(800);
await b.key('o', 'KeyO', 79, { text: 'o' });
await b.sleep(500);
await b.eval('window.__mark = 3');
await b.key('F5', 'F5', 116);
await b.sleep(1500);
await reboot();
const ovMark = await b.eval('window.__mark || 0');
const o0 = await st();
await b.key('PageDown', 'PageDown', 34);
await b.sleep(400);
const o1 = await st();
const ovOpen = await b.eval("document.querySelector('.overview').classList.contains('show')");
check('F13c slide grid open: F5 does not reload; PgDn closes the grid and advances', ovMark === 3 && !ovOpen && JSON.stringify(o0) !== JSON.stringify(o1), JSON.stringify({ ovMark, ovOpen, o0, o1 }));

// ── F12: presenter window (same channel, here in an iframe) drives the deck ──
await b.goto(URL0 + '#/3');
await b.sleep(1000);
const pv = await b.eval(`(async () => {
  const f = document.createElement('iframe'); f.src = location.pathname + '?presenter#/3'; f.style.cssText = 'position:fixed;width:800px;height:600px;opacity:0';
  document.body.appendChild(f);
  await new Promise((r) => f.onload = r);
  const d = f.contentDocument; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 40 && d.getElementById('sync')?.textContent !== 'متصل'; i++) await wait(100);
  const synced = d.getElementById('sync').textContent, before = [__deck.index, __deck.step];
  d.getElementById('nextb').click(); await wait(300);
  const after = [__deck.index, __deck.step];
  // Remote keys pressed while the speaker view has focus.
  const kd = (key, code) => { const ev = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }); f.contentWindow.dispatchEvent(ev); return ev.defaultPrevented; };
  const black = () => document.querySelector('.blackout').classList.contains('show');
  const f5Blocked = kd('F5', 'F5');
  kd('b', 'KeyB'); await wait(300); const blackOn = black();
  kd('Escape', 'Escape'); await wait(300); const blackOff = !black();
  const timerSaved = !!f.contentWindow.sessionStorage.getItem('avyra-presenter-t0');
  return { synced, before, after, title: d.getElementById('title').textContent, f5Blocked, blackOn, blackOff, timerSaved };
})()`);
check('F12 presenter view syncs and its "next" drives the deck', pv.synced === 'متصل' && JSON.stringify(pv.before) !== JSON.stringify(pv.after), JSON.stringify(pv));
check('F12b speaker view: F5 never reloads it, B blanks and Esc restores the audience screen, talk timer survives a reload', pv.f5Blocked && pv.blackOn && pv.blackOff && pv.timerSaved, JSON.stringify(pv));

// ── T6: the Q&A agent answers every suggested question with its own entry ─────
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const { answer } = await import(pathToFileURL(path.join(SRC, 'assistant/assistant.js')));
const { KB } = await import(pathToFileURL(path.join(SRC, 'assistant/kb.js')));
const wrong = KB.filter((e) => answer(e.q) !== e).map((e) => e.q);
check('T6a every assistant question maps to its own answer', wrong.length === 0, wrong.join(' | '));
const { SETS, KEYS } = await import('./questions.mjs');
let qTotal = 0, qOk = 0;
const qBad = [];
for (const [name, set] of Object.entries(SETS)) for (const [q, want] of set) {
  qTotal++;
  const r = answer(q);
  if (want.split('|').some((w) => (w === 'null' ? !r : r && r.q.includes(KEYS[w])))) qOk++;
  else qBad.push({ set: name, q, got: r ? r.q : null });
}
const qWrong = qBad.filter((x) => x.got);
check(`T6b ${qTotal} judge-style questions: ≥ 95 % answered correctly, none answered wrongly`, qWrong.length === 0 && qOk / qTotal >= 0.95, `${qOk}/${qTotal} · ` + qBad.map((x) => `${x.set} «${x.q}» → ${x.got || 'out of scope'}`).slice(0, 6).join(' | '));
const askText = KB.find((e) => e.slide === 'ask').a();
check('F9g the funding answer does not state the unconfirmed runway', !/12|18/.test(askText), askText.slice(0, 90));

fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, perSlide, small: [...new Set(allSmall)], clipped: [...new Set(allClip)], overlaps: [...new Set(allOv)], errors: b.errors }, null, 1));
b.close();
srv.close();
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
