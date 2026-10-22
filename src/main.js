import '@fontsource/ibm-plex-sans-arabic/arabic-300.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource-variable/inter';
import './styles/base.css';
import './styles/chrome.css';
import './styles/slides.css';
import './styles/assistant.css';

import { CONFIG } from './config.js';
import { slides } from './slides/index.js';

const BASE = import.meta.env.BASE_URL;

function grain() {
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const g = c.getContext('2d');
  const d = g.createImageData(180, 180);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  document.querySelector('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

const NullStage = {
  markerPos: { ok: false },
  apply() {}, setScale() {}, setMarker() {}, setMarkerTone() {}, setScan() {}, setHolo() {},
  takeoff() {}, resetFlight() {}, onFrame() { return () => {}; },
};

async function boot() {
  const stageEl = document.getElementById('stage');
  let stage3d = NullStage;
  const fit = () => {
    const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const x = (window.innerWidth - 1920 * k) / 2, y = (window.innerHeight - 1080 * k) / 2;
    stageEl.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    stage3d.setScale(k);
  };
  fit();
  grain();
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  try {
    const { Stage3D } = await import('./three/stage3d.js');
    stage3d = new Stage3D({
      canvas: document.getElementById('gl'),
      overlay: document.getElementById('overlay3d'),
      stage: stageEl,
      logoUrl: `${BASE}assets/logo-badge.png`,
    });
  } catch (e) {
    console.warn('3D disabled:', e);
    document.body.classList.add('no-3d');
  }

  const [{ createDeck }, { createChrome }, { createAssistant }] = await Promise.all([
    import('./deck.js'), import('./chrome.js'), import('./assistant/assistant.js'),
  ]);
  const ctx = { stage3d, config: CONFIG, BASE, deck: null, assistant: null };
  const deck = createDeck({ slides, container: document.getElementById('slides'), ctx });
  ctx.deck = deck;
  ctx.assistant = createAssistant({ root: stageEl, deck });
  createChrome({ root: document.getElementById('chrome'), deck, ctx });

  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    if (m && (+m[1] - 1 !== deck.index || +(m[2] || 0) !== deck.step)) deck.go(+m[1] - 1, +(m[2] || 0));
  });
  fit();
  deck.start();
  window.__deck = deck;
  window.__stage3d = stage3d; // debug handle (console / automated checks)
  requestAnimationFrame(() => document.getElementById('boot').classList.add('done'));
}

if (new URLSearchParams(location.search).has('presenter')) {
  import('./presenter.js').then((m) => m.initPresenter(slides));
} else {
  boot();
}
