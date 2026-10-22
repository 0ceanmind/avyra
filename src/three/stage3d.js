// One persistent WebGL layer shared by every slide that needs the aircraft.
// Slides request a named *pose*; the camera rig tweens between poses so the
// aircraft feels like a single object travelling through the story.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { buildAircraft, L } from './aircraft.js';

const POSES = {
  hero: { dist: 92, azim: 2.28, elev: 0.2, shiftX: 0, shiftY: 290, ty: 0, ground: 0, gear: 0, fan: 9, bob: 1, auto: 0.07, holo: 0, drag: true },
  aog: { dist: 96, azim: 2.02, elev: 0.3, shiftX: -440, shiftY: 70, ty: -1.4, ground: 1, gear: 1, fan: 0, bob: 0, auto: 0, holo: 0, drag: true },
  demo: { dist: 128, azim: 2.06, elev: 0.36, shiftX: -470, shiftY: -170, ty: -1.4, ground: 1, gear: 1, fan: 0, bob: 0, auto: 0, holo: 0, drag: true },
  closing: { dist: 100, azim: 1.66, elev: 0.1, shiftX: 120, shiftY: 300, ty: -1.0, ground: 1, gear: 1, fan: 3, bob: 0, auto: 0, holo: 0, drag: false },
};

export class Stage3D {
  constructor({ canvas, overlay, stage, logoUrl }) {
    this.canvas = canvas;
    this.overlay = overlay;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.9;

    this.camera = new THREE.PerspectiveCamera(26, 1920 / 1080, 1, 3000);

    this.scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x08101c, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-30, 50, 40);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x3ad8f7, 2.4);
    rim.position.set(30, 14, -50);
    this.scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0x93e25b, 0.6);
    rim2.position.set(40, -10, 30);
    this.scene.add(rim2);

    this.ac = buildAircraft(r, { logoUrl });
    this.scene.add(this.ac.root, this.ac.ground);

    this.rig = { dist: 90, azim: 2.3, elev: 0.2, shiftX: 0, shiftY: 250, ty: 0, ground: 0, gear: 0, fan: 0, bob: 0, holo: 0, zoom: 1 };
    this.user = { yaw: 0, pitch: 0, vy: 0, dragging: false, lx: 0, ly: 0 };
    this.fly = { x: 0, y: 0, pitch: 0 };
    this.autoYaw = 0;
    this.pose = null;
    this.visible = false;
    this.running = false;
    this.scan = { on: false, speed: 22 };
    this.frameFns = new Set();
    this.clock = new THREE.Clock();
    this.pr = 0;
    this.prCap = 0;
    this._perf = { skip: 0, samples: [], trial: null, locked: false };
    this._v = new THREE.Vector3();

    this.marker = document.createElement('div');
    this.marker.className = 'mk';
    this.marker.innerHTML = '<span class="mk-ring"></span><span class="mk-ring r2"></span><span class="mk-dot"></span><span class="mk-line"></span><span class="mk-label"></span>';
    overlay.appendChild(this.marker);
    this.markerPoint = null;
    this.markerPos = { x: -999, y: -999, ok: false };

    this.loop = this.loop.bind(this);
    this.bindDrag(stage);
    this.setScale(1);
    this.applyRig();
    r.compile(this.scene, this.camera);
  }

  // Render resolution follows the real screen size (sharp on 4K), capped at 2×.
  // perf() watches the frame time while the aircraft is on screen. If the GPU cannot hold
  // ~40 fps, it lowers the resolution in 0.25 steps, down to 0.75× (a 1080p screen starts
  // at 1×, so it gets a fallback too); at the floor it also turns off backdrop blur, the
  // costliest effect over a moving WebGL layer. Each step is a trial: if the frame time
  // does not improve, resolution was not the bottleneck (e.g. a TV running at 30 Hz) —
  // the step is undone and adaptation stops, so the aircraft never gets softer for nothing.
  setScale(k) {
    this.maxPR = Math.min(2, Math.max(1, k * (window.devicePixelRatio || 1)));
    this.applyPR(Math.min(this.maxPR, this.prCap || this.maxPR));
  }
  applyPR(pr) {
    if (pr === this.pr) return;
    this.pr = pr;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(1920, 1080, false);
    if (!this.running) this.render();
  }
  perf(raw) {
    const p = this._perf;
    if (p.locked || raw > 0.25 || document.hidden) return; // tab switch / pause, not GPU load
    if (++p.skip <= 30) return; // ignore warm-up frames (shader compile, pose change)
    p.samples.push(raw);
    if (p.samples.length < 60) return;
    const median = p.samples.sort((a, b) => a - b)[30];
    p.samples.length = 0;
    if (p.trial) {
      const helped = median < p.trial.median * 0.9;
      if (!helped) { this.prCap = p.trial.from; this.applyPR(p.trial.from); p.locked = true; p.trial = null; return; }
      p.trial = null;
    }
    if (median <= 0.024) return;
    if (this.pr > 0.75) {
      p.trial = { from: this.pr, median };
      this.prCap = Math.max(0.75, this.pr - 0.25);
      this.applyPR(this.prCap);
      p.skip = 0;
    } else if (!document.documentElement.classList.contains('lowfx')) {
      document.documentElement.classList.add('lowfx');
      p.skip = 0;
    }
  }

  // ── Pose / visibility ──────────────────────────────────────────────
  apply(poseName) {
    const p = POSES[poseName];
    gsap.killTweensOf(this.rig);
    if (!p) {
      this.pose = null;
      this.setVisible(false);
      this.setMarker(null);
      this.setScan(false);
      return;
    }
    const first = !this.visible;
    this.pose = p;
    this.user.vy = 0;
    gsap.to(this.user, { yaw: 0, pitch: 0, duration: 1.2, ease: 'power3.inOut' });
    const target = { dist: p.dist, azim: p.azim, elev: p.elev, shiftX: p.shiftX, shiftY: p.shiftY, ty: p.ty, ground: p.ground, gear: p.gear, fan: p.fan, bob: p.bob, holo: p.holo, zoom: 1 };
    if (first) {
      Object.assign(this.rig, target, { dist: p.dist * 1.12 });
      this.autoYaw = 0;
      gsap.to(this.rig, { dist: p.dist, duration: 2.2, ease: 'power3.out' });
    } else {
      gsap.to(this.rig, { ...target, duration: 1.6, ease: 'power3.inOut' });
    }
    if (!p.auto) gsap.to(this, { autoYaw: 0, duration: 1.4, ease: 'power3.inOut' });
    this.setVisible(true);
  }

  setVisible(v) {
    this.visible = v;
    this.canvas.classList.toggle('on', v);
    clearTimeout(this._hideT);
    if (v) this.start();
    else this._hideT = setTimeout(() => { if (!this.visible) this.stop(); }, 1000);
  }
  start() { if (!this.running) { this.running = true; this.clock.getDelta(); this._perf.skip = 0; this._perf.samples.length = 0; requestAnimationFrame(this.loop); } }
  stop() { this.running = false; }

  // ── Effects API used by slides ─────────────────────────────────────
  setMarker(point, label = '', tone = 'red') {
    this.markerPoint = point ? this.ac.points[point] : null;
    this.marker.classList.toggle('show', !!point);
    this.marker.dataset.tone = tone;
    if (point) this.marker.querySelector('.mk-label').innerHTML = label;
  }
  setMarkerTone(tone) { this.marker.dataset.tone = tone; }
  setScan(on) {
    this.scan.on = on;
    gsap.to(this.ac.fx.uScanOn, { value: on ? 1 : 0, duration: 0.6 });
  }
  setHolo(v, d = 1.2) { gsap.to(this.rig, { holo: v, duration: d, ease: 'power2.inOut' }); }
  onFrame(fn) { this.frameFns.add(fn); return () => this.frameFns.delete(fn); }

  takeoff(delay = 0.4) {
    this.resetFlight();
    const f = this.fly;
    const tl = (this.tl = gsap.timeline({ delay }));
    tl.to(this.rig, { fan: 34, duration: 1.4, ease: 'power2.in' }, 0)
      .to(f, { x: -46, duration: 3.0, ease: 'power2.in' }, 0.6)
      .to(f, { pitch: -0.2, duration: 0.9, ease: 'power2.out' }, 2.9)
      .to(f, { x: -190, y: 52, duration: 3.6, ease: 'power1.in' }, 3.3)
      .to(this.rig, { gear: 0, duration: 1.2, ease: 'power2.inOut' }, 3.8)
      .to(this.rig, { ground: 0, duration: 1.6 }, 4.4)
      .add(() => this.setVisible(false), 6.2);
    return tl;
  }
  resetFlight() {
    this.tl?.kill();
    this.tl = null;
    Object.assign(this.fly, { x: 0, y: 0, pitch: 0 });
  }

  // ── Interaction: drag to orbit, wheel to zoom, double-click to reset ─
  bindDrag(stage) {
    const ignore = (e) => e.target.closest('button, input, a, .glass, .no-drag, .assistant, .overview, .help, .ch-tools, .pop');
    stage.addEventListener('pointerdown', (e) => {
      if (!this.visible || !this.pose?.drag || ignore(e)) return;
      this.user.dragging = true;
      this.user.lx = e.clientX; this.user.ly = e.clientY;
      this.user.vy = 0;
      gsap.killTweensOf(this.user);
      stage.setPointerCapture?.(e.pointerId);
      document.body.classList.add('grabbing');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!this.user.dragging) return;
      const dx = e.clientX - this.user.lx, dy = e.clientY - this.user.ly;
      this.user.lx = e.clientX; this.user.ly = e.clientY;
      const k = 1920 / stage.getBoundingClientRect().width;
      this.user.vy = dx * k * 0.0055;
      this.user.yaw += this.user.vy;
      this.user.pitch = Math.max(-0.25, Math.min(0.75, this.user.pitch + dy * k * 0.003));
    });
    const end = () => { this.user.dragging = false; document.body.classList.remove('grabbing'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('dblclick', (e) => {
      if (!this.visible || !this.pose?.drag || ignore(e)) return;
      gsap.to(this.user, { yaw: 0, pitch: 0, vy: 0, duration: 1.2, ease: 'power3.inOut' });
      gsap.to(this.rig, { zoom: 1, duration: 1.2, ease: 'power3.inOut' });
    });
    stage.addEventListener('wheel', (e) => {
      if (!this.visible || !this.pose?.drag || ignore(e)) return;
      this.rig.zoom = Math.max(0.6, Math.min(1.4, this.rig.zoom * (1 + Math.sign(e.deltaY) * 0.06)));
    }, { passive: true });
  }

  // ── Frame ──────────────────────────────────────────────────────────
  applyRig(t = 0) {
    const { rig, user, ac, camera, fly } = this;
    const elev = rig.elev + user.pitch;
    const d = rig.dist * rig.zoom;
    camera.position.set(
      Math.cos(elev) * Math.cos(rig.azim) * d,
      rig.ty + Math.sin(elev) * d,
      Math.cos(elev) * Math.sin(rig.azim) * d
    );
    camera.lookAt(0, rig.ty, 0);
    camera.setViewOffset(1920, 1080, -rig.shiftX, -rig.shiftY, 1920, 1080);

    const root = ac.root;
    root.rotation.set(rig.bob * Math.sin(t * 0.55) * 0.035, user.yaw + this.autoYaw, fly.pitch);
    root.position.set(fly.x, rig.bob * Math.sin(t * 0.8) * 0.45 + fly.y, 0);

    const g = Math.max(0.0001, rig.gear);
    ac.gear.visible = rig.gear > 0.01;
    ac.gear.scale.set(1, g, 1);
    ac.gear.position.y = (1 - g) * -1.2;

    ac.ground.material.uniforms.uOpacity.value = rig.ground;
    ac.ground.visible = rig.ground > 0.001;
    ac.fx.uHolo.value = rig.holo;
  }

  loop() {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    this.perf(raw);
    const dt = Math.min(0.05, raw);
    const t = this.clock.elapsedTime;
    const u = this.user;
    if (!u.dragging) {
      u.vy *= 0.94;
      if (Math.abs(u.vy) > 1e-4) u.yaw += u.vy;
    }
    if (this.pose?.auto) this.autoYaw += dt * this.pose.auto;
    for (const f of this.ac.fans) f.rotation.x += this.rig.fan * dt;
    if (this.scan.on) {
      const span = L + 14;
      this.ac.fx.uScan.value = ((t * this.scan.speed) % span) - 7;
    }
    this.applyRig(t);
    this.render();
  }

  render() {
    this.ac.model.updateMatrixWorld(true);
    this.ac.fx.uInvModel.value.copy(this.ac.model.matrixWorld).invert();
    this.renderer.render(this.scene, this.camera);
    this.updateMarker();
    for (const fn of this.frameFns) fn(this.markerPos);
  }

  updateMarker() {
    const mp = this.markerPos;
    if (!this.markerPoint) { mp.ok = false; return; }
    const v = this._v.copy(this.markerPoint).applyMatrix4(this.ac.model.matrixWorld).project(this.camera);
    mp.ok = v.z < 1;
    mp.x = (v.x * 0.5 + 0.5) * 1920;
    mp.y = (1 - (v.y * 0.5 + 0.5)) * 1080;
    this.marker.style.transform = `translate3d(${mp.x.toFixed(1)}px, ${mp.y.toFixed(1)}px, 0)`;
  }
}

// No-WebGL fallback with the same surface.
export class NullStage {
  constructor() { this.markerPos = { ok: false }; }
  apply() {} setScale() {} setMarker() {} setMarkerTone() {} setScan() {} setHolo() {} takeoff() { return null; } resetFlight() {}
  onFrame() { return () => {}; }
}
