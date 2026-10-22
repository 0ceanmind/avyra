import { icon } from '../icons.js';

export const AGENTS = [
  { name: 'معرّف الطائرة / العطل', ic: 'hash', tip: 'يحدّد الطائرة ونوع العطل وموقعه من البلاغ.' },
  { name: 'تنبؤ العطل', ic: 'activity', tip: 'يقدّر احتمال الفشل وأثره التشغيلي من سجل الأعطال.' },
  { name: 'تحديد القطعة', ic: 'box', tip: 'يحدّد القطعة المطلوبة ومكان توفّرها في المخزون.' },
  { name: 'فحص العقد', ic: 'file', tip: 'يتحقق من تغطية عقد الصيانة للقطع والعمالة.' },
  { name: 'مقارنة الفريق / المتعاقد', ic: 'scale', tip: 'يقارن الوقت والتكلفة والجاهزية بين الخيارين.' },
  { name: 'توصية بدرجة ثقة', ic: 'gauge', tip: 'يُصدر التوصية مع الأسباب والتكلفة والوقت المتوقع والبديل.' },
];

export default {
  id: 'product',
  title: 'ستة وكلاء، توصية واحدة',
  chapter: 'المنتج',
  steps: 2,
  notes: `المنتج: ستة وكلاء فرعيين، توصية واحدة.
1 معرّف الطائرة/العطل · 2 تنبؤ العطل · 3 تحديد القطعة · 4 فحص العقد · 5 مقارنة الفريق/المتعاقد · 6 توصية بدرجة ثقة · 7 موافقة المهندس.
التدفق: المهندس يُدخل معرّف الطائرة أو رقم الحالة ← الوكلاء الفرعيون يحلّلون البيانات بالتتابع خلال ثوانٍ ← يعرض النظام التوصية مع الأسباب، التكلفة، الوقت المتوقع، والبديل ← المهندس يوافق / يرفض / يطلب إعادة تحليل بضغطة واحدة.
مبني على محرك Scoring حسابي شفاف + Claude لتوليد التفسير بلغة مفهومة للمهندس — وليس "صندوقاً أسود".
(مرّر المؤشر على أي وكيل لعرض دوره.)`,
  html: () => `
    <div class="eyebrow" data-in="0">المنتج</div>
    <h2 class="t-l" data-in="0" style="--d:100">ستة وكلاء. <span class="grad">توصية واحدة.</span></h2>
    <div class="pd-chain">
      <div class="pd-track fade" data-in="0" style="--d:300"><i class="pd-pulse"></i></div>
      <div class="pd-node pd-input" data-in="0" style="--d:250">
        <div class="pd-c">${icon('plane', 44)}</div>
        <b class="mono ltr">A4O-AVY</b>
        <span>المعرّف</span>
      </div>
      ${AGENTS.map((a, i) => `
        <div class="pd-node pd-agent" data-in="0" style="--d:${350 + i * 90};--i:${i}" tabindex="0">
          <div class="pd-c"><em class="num">${i + 1}</em>${icon(a.ic, 44)}</div>
          <span>${a.name}</span>
          <div class="pop">${a.tip}</div>
        </div>`).join('')}
      <div class="pd-node pd-eng" data-in="0" style="--d:900;--i:6" tabindex="0">
        <div class="pd-c"><em class="num">7</em>${icon('userCheck', 48)}</div>
        <span>موافقة المهندس</span>
        <div class="pop">يوافق / يرفض / يطلب إعادة تحليل — بضغطة واحدة.</div>
      </div>
    </div>
    <div class="pd-phases" data-in="1">
      <div class="ph" style="--w:1"><i></i><span>يُدخل</span></div>
      <div class="ph" style="--w:6"><i></i><span>تحليل متتابع — <b>خلال ثوانٍ</b></span></div>
      <div class="ph" style="--w:1"><i></i><span>يعتمد</span></div>
    </div>
    <div class="pd-foot" data-in="1" style="--d:350">
      <span class="chip">${icon('calc')} Scoring حسابي شفاف</span>
      <span class="plus">+</span>
      <span class="chip">${icon('sparkle')} Claude لتفسير القرار</span>
      <span class="muted">= ليس «صندوقاً أسود»</span>
    </div>
  `,
};
