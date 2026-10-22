// Transparent arithmetic scoring engine (simulation).
// score = Σ weight × factor, every factor 0–100 and visible on screen.

export const FACTORS = [
  { id: 'time', label: 'الوقت حتى الإصلاح', short: 'الوقت', color: '#3ad8f7' },
  { id: 'cost', label: 'التكلفة الإجمالية', short: 'التكلفة', color: '#3a7bff' },
  { id: 'ready', label: 'جاهزية الكوادر والأدوات', short: 'الجاهزية', color: '#2ee6c5' },
  { id: 'part', label: 'توفّر القطعة', short: 'القطعة', color: '#93e25b' },
  { id: 'cover', label: 'التغطية التعاقدية', short: 'العقد', color: '#b7c3ff' },
];
export const WEIGHTS = { time: 0.3, cost: 0.25, ready: 0.2, part: 0.15, cover: 0.1 };
export const WEIGHTS_AOG = { time: 0.45, cost: 0.15, ready: 0.2, part: 0.12, cover: 0.08 };

const clamp = (v) => Math.max(0, Math.min(100, v));

export function factorScores(o) {
  return {
    time: clamp(100 * (1 - o.hours / 48)),
    cost: clamp(100 * (1 - o.cost / 40000)),
    ready: o.ready,
    part: o.part,
    cover: o.cover,
  };
}

export function score(o, w = WEIGHTS) {
  const s = factorScores(o);
  const contrib = {};
  let total = 0;
  for (const f of FACTORS) { contrib[f.id] = w[f.id] * s[f.id]; total += contrib[f.id]; }
  return { s, contrib, total };
}

export function decide(team, mro, w = WEIGHTS) {
  const a = score(team, w), b = score(mro, w);
  const winner = a.total >= b.total ? 'team' : 'mro';
  const margin = Math.abs(a.total - b.total);
  const confidence = Math.round(Math.min(96, 50 + 1.6 * margin));
  const W = winner === 'team' ? a : b, Lz = winner === 'team' ? b : a;
  const drivers = FACTORS.map((f) => ({ f, d: W.contrib[f.id] - Lz.contrib[f.id] })).sort((x, y) => y.d - x.d).filter((x) => x.d > 0.5);
  return { team: a, mro: b, winner, margin, confidence, drivers };
}

export const NAMES = { team: 'الفريق المحلي', mro: 'MRO المتعاقد' };

export function explain(r) {
  const who = NAMES[r.winner];
  const top = r.drivers.slice(0, 2).map((x) => x.f.short);
  const why = top.length === 2 ? `${top[0]} و${top[1]}` : top[0] || 'المجموع';
  return `يُوصى بـ«${who}» لتفوّقه في ${why}؛ الفارق ${r.margin.toFixed(1)} نقطة، والثقة ${r.confidence}%.`;
}

// Simulated cases used by the live demo (Demo Mode).
export const CASES = [
  {
    id: 'A4O-AVY',
    tag: 'ATA 36',
    fault: 'صمام الهواء النازف · المحرك 1',
    point: 'engine',
    team: { hours: 6, cost: 4800, ready: 100, part: 100, cover: 100 },
    mro: { hours: 14, cost: 12500, ready: 80, part: 100, cover: 40 },
    out: [
      'A320neo · ATA 36 — صمام الضغط العالي، المحرك 1',
      'احتمال فشل 82% خلال 40 ساعة طيران',
      'صمام HP · متوفر (1) — مستودع مسقط',
      'العقد يغطي القطع فقط — العمالة خارج التغطية',
      'الفريق 6 س · 4.8K$ — المتعاقد 14 س · 12.5K$',
    ],
    reasons: ['فنيّان B1 مؤهّلان متاحان الآن', 'القطعة في المخزون المحلي', 'عمالة المتعاقد غير مغطاة'],
    alt: 'المتعاقد — إذا لم يتوفّر الفريق خلال 4 ساعات',
  },
  {
    id: 'A4O-AVZ',
    tag: 'ATA 32',
    fault: 'تسرّب هيدروليكي · جهاز الهبوط الرئيسي',
    point: 'gear',
    team: { hours: 22, cost: 31000, ready: 30, part: 30, cover: 30 },
    mro: { hours: 9, cost: 18000, ready: 100, part: 100, cover: 100 },
    out: [
      'A320neo · ATA 32 — مشغّل جهاز الهبوط الرئيسي الأيسر',
      'احتمال فشل 91% — يمنع الإقلاع (AOG)',
      'المشغّل غير متوفر محلياً — متوفر لدى المتعاقد',
      'تغطية كاملة لـ ATA 32: قطع + عمالة',
      'الفريق 22 س · 31K$ — المتعاقد 9 س · 18K$',
    ],
    reasons: ['أدوات رفع خاصة غير متوفرة محلياً', 'القطعة جاهزة لدى المتعاقد', 'العقد يغطي القطع والعمالة'],
    alt: 'الفريق المحلي — بعد وصول القطعة (≈ 22 س)',
  },
];
