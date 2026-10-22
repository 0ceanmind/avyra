// Minimal dependency-free Chrome DevTools Protocol driver + static server (Node ≥ 22: global WebSocket).
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.json': 'application/json' };

export function serve(dir, port) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dir, p);
    fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, profile, w = 1920, h = 1080 }) {
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${w},${h}`, '--force-device-scale-factor=1', '--hide-scrollbars',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', 'about:blank',
  ], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {}
    await sleep(250);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  const handlers = new Set();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else handlers.forEach((fn) => fn(m));
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const errors = [];
  handlers.add((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) errors.push(m.params.type.toUpperCase() + ' ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  const api = {
    send, errors,
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async goto(url) {
      // Always a fresh document (a hash-only navigation would keep the old page state).
      await send('Page.navigate', { url: 'about:blank' });
      await sleep(200);
      await send('Page.navigate', { url });
      for (let i = 0; i < 80; i++) { await sleep(250); try { if (await api.eval('!!window.__deck && document.getElementById("boot").classList.contains("done")')) return; } catch {} }
      throw new Error('deck did not boot');
    },
    async key(key, code, keyCode, extra = {}) {
      const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...extra };
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
      if (extra.text) await send('Input.dispatchKeyEvent', { type: 'char', ...base });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    },
    right: () => api.key('ArrowRight', 'ArrowRight', 39),
    left: () => api.key('ArrowLeft', 'ArrowLeft', 37),
    space: () => api.key(' ', 'Space', 32, { text: ' ' }),
    async type(text) { for (const ch of text) await send('Input.dispatchKeyEvent', { type: 'char', text: ch }); },
    async click(x, y) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    },
    async clickSel(sel) {
      const r = await api.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`);
      if (!r) throw new Error('no element ' + sel);
      await api.click(r[0], r[1]);
    },
    async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    sleep,
    close() { try { ws.close(); } catch {} proc.kill(); },
  };
  return api;
}
