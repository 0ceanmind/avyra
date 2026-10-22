import { icon } from '../icons.js';
import { BASE } from './util.js';

const INPUTS = [
  { name: 'التنبؤ بالعطل', ic: 'activity' },
  { name: 'القطعة المطلوبة', ic: 'box' },
  { name: 'تغطية العقد', ic: 'file' },
  { name: 'توفّر الفريق', ic: 'users' },
];
// Flow box coordinates (LTR SVG space, 1640×600)
const IN_X = 1260, CORE = [930, 238], CORE_R = 120, REC = [380, 760], ENG_X = 250;
const inY = (k) => 50 + k * 125;

export default {
  id: 'solution',
  title: 'توصية واحدة موثّقة',
  chapter: 'الحل',
  steps: 3,
  notes: `الحل — AVYRA: توصية صيانة واحدة، موثّقة، خلال دقائق.
يحلّل الحالة كاملة: التنبؤ بالعطل + القطعة المطلوبة + تغطية العقد + توفّر الفريق.
أول حل يقارن تلقائياً "الفريق المحلي" مقابل "MRO المتعاقد" بمنطق شفاف (سبب + دليل + درجة ثقة) — بدل الاعتماد على خبرة شخصية.
القرار النهائي يبقى دائماً بيد المهندس — الوكيل يوصي ولا يُنفّذ شيئاً بدون موافقة بشرية صريحة.`,
  html: () => `
    <div class="eyebrow" data-in="0">الحل · AVYRA</div>
    <h2 class="t-l" data-in="0" style="--d:100">توصية واحدة. موثّقة. <span class="grad">خلال دقائق.</span></h2>
    <div class="sol-flow">
      <svg viewBox="0 0 1640 600" aria-hidden="true">
        <defs>
          <linearGradient id="solg" x1="1" x2="0" y1="0" y2="0"><stop offset="0" stop-color="#3ad8f7" stop-opacity=".15"/><stop offset="1" stop-color="#3ad8f7"/></linearGradient>
        </defs>
        ${INPUTS.map((_, k) => `<path class="sol-p fade" data-in="0" style="--d:${500 + k * 120}" d="M${IN_X},${inY(k)} C1150,${inY(k)} 1130,${CORE[1]} ${CORE[0] + CORE_R},${CORE[1]}"/>`).join('')}
        <path class="sol-p out" data-in="1" d="M${CORE[0] - CORE_R},${CORE[1]} L${REC[1]},${CORE[1]}"/>
        <path class="sol-p out" data-in="2" d="M${REC[0]},${CORE[1]} L${ENG_X},${CORE[1]}"/>
      </svg>
      ${INPUTS.map((s, k) => `
        <div class="sol-in glass" data-in="0" style="--d:${250 + k * 110};top:${inY(k) - 50}px">${icon(s.ic, 34)}<span>${s.name}</span></div>`).join('')}
      <div class="sol-core" data-in="0" style="--d:700"><i class="ring"></i><img src="${BASE}assets/logo-badge.png" alt=""></div>
      <div class="sol-rec glass" data-in="1" style="--d:200">
        <span class="label">التوصية</span>
        <b>الفريق المحلي</b>
        <div class="sol-chips"><span class="chip sm">${icon('search')} السبب</span><span class="chip sm">${icon('file')} الدليل</span><span class="chip sm">${icon('gauge')} الثقة <span class="num ltr">82%</span></span></div>
      </div>
      <div class="sol-eng" data-in="2" style="--d:250">
        <div class="sol-eng-c">${icon('userCheck', 56)}</div>
        <b>المهندس يعتمد</b>
        <span class="label">القرار النهائي له</span>
      </div>
    </div>
    <div class="sol-notes">
      <p data-in="1" style="--d:500">${icon('scale', 30)} أول حل يقارن تلقائياً: <b>الفريق المحلي</b> ⟷ <b>MRO المتعاقد</b></p>
      <p data-in="2" style="--d:500">${icon('shield', 30)} الوكيل يوصي — ولا يُنفّذ شيئاً دون <b>موافقة بشرية صريحة</b></p>
    </div>
  `,
};
