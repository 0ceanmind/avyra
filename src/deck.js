// Deck engine: slide/step state machine, keyboard + touch + hash + presenter sync.
// Every step is applied as idempotent *state* (not a one-shot event), so jumping,
// going back, or reloading mid-slide always renders correctly.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Numeric ranges like "10–40" or "$2.6–7.8M" flip to "40–10" inside RTL text.
// Wrap them in Unicode LTR isolates so they always read left→right.
export const RANGE = /\$?\d[\d.,]*\s?–\s?\$?\d[\d.,]*[KMB%]?/g;
export const isolate = (s) => s.replace(RANGE, (m) => `⁦${m}⁩`);
function isolateRanges(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  const has = new RegExp(RANGE.source);
  while (w.nextNode()) if (has.test(w.currentNode.nodeValue)) nodes.push(w.currentNode);
  for (const n of nodes) n.nodeValue = isolate(n.nodeValue);
}

export function createDeck({ slides, container, ctx }) {
  const total = slides.length;
  const els = [];
  let index = -1;
  let step = 0;
  const listeners = new Set();
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('avyra-deck') : null;

  slides.forEach((s, i) => {
    const el = document.createElement('section');
    el.className = `slide slide-${s.id}`;
    el.setAttribute('aria-roledescription', 'slide');
    el.setAttribute('aria-label', `${i + 1} / ${total} — ${s.title}`);
    el.innerHTML = s.html(ctx);
    isolateRanges(el);
    container.appendChild(el);
    els.push(el);
  });

  const stepsOf = (i) => Math.max(1, slides[i].steps || 1);

  function setStepClasses(el, st) {
    el.dataset.step = st;
    for (let k = 1; k <= 8; k++) el.classList.toggle('st-' + k, st >= k);
  }

  function go(i, st = 0) {
    i = clamp(i, 0, total - 1);
    const s = slides[i];
    const max = stepsOf(i) - 1;
    st = st === 'last' ? max : clamp(st | 0, 0, max);

    if (i !== index) {
      const dir = i > index ? 1 : -1;
      if (index >= 0) {
        const ps = slides[index];
        const pel = els[index];
        try { ps.leave?.(pel, ctx); } catch (e) { console.error(e); }
        pel.classList.remove('active');
        setStepClasses(pel, 0);
      }
      index = i;
      step = st;
      const el = els[i];
      document.body.dataset.slide = s.id;
      document.body.className = document.body.className.replace(/\bmood-\S+/g, '').trim();
      if (s.mood) document.body.classList.add('mood-' + s.mood);
      ctx.stage3d?.apply(s.three || null, s);
      el.classList.add('active');
      setStepClasses(el, st);
      try {
        s.enter?.(el, ctx, st, dir);
        s.step?.(st, el, ctx, dir);
      } catch (e) { console.error(e); }
    } else if (st !== step) {
      const dir = st > step ? 1 : -1;
      step = st;
      setStepClasses(els[i], st);
      try { s.step?.(st, els[i], ctx, dir); } catch (e) { console.error(e); }
    }
    emit();
  }

  function next() {
    const s = slides[index];
    if (s.intercept?.('next', els[index], ctx)) return;
    if (step < stepsOf(index) - 1) go(index, step + 1);
    else if (index < total - 1) go(index + 1, 0);
  }
  function prev() {
    const s = slides[index];
    if (s.intercept?.('prev', els[index], ctx)) return;
    if (step > 0) go(index, step - 1);
    else if (index > 0) go(index - 1, 'last');
  }
  function replay() {
    const i = index;
    const el = els[i];
    try { slides[i].leave?.(el, ctx); } catch (e) { console.error(e); }
    el.classList.remove('active');
    setStepClasses(el, 0);
    index = -1;
    void el.offsetWidth;
    go(i, 0);
  }

  function emit() {
    const st = state();
    const hash = `#/${index + 1}${step ? '/' + step : ''}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    listeners.forEach((fn) => fn(st));
    channel?.postMessage({ type: 'state', ...st });
  }
  const state = () => ({ index, step, steps: stepsOf(index), total, id: slides[index].id });

  channel?.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'hello') channel.postMessage({ type: 'state', ...state() });
    if (m.type === 'cmd') {
      if (m.cmd === 'next') next();
      if (m.cmd === 'prev') prev();
      if (m.cmd === 'go') go(m.index, m.step || 0);
      if (m.cmd === 'replay') replay();
    }
  });

  function fromHash() {
    const m = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    if (m) return [parseInt(m[1], 10) - 1, parseInt(m[2] || '0', 10)];
    return [0, 0];
  }

  // Wire up slide modules once their DOM exists.
  slides.forEach((s, i) => {
    try { s.mount?.(els[i], ctx); } catch (e) { console.error('mount', s.id, e); }
  });

  return {
    slides, els, total,
    go, next, prev, replay,
    get index() { return index; },
    get step() { return step; },
    state,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start() { const [i, st] = fromHash(); go(i, st); },
    current() { return { slide: slides[index], el: els[index] }; },
  };
}
