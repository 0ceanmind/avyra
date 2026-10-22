import { icon } from '../icons.js';
import { $, $$ } from './util.js';

// Business Model Canvas. Note: in the source deck the "cost structure" and
// "revenue streams" texts were swapped; they are placed correctly here.
const BLOCKS = [
  { a: 'seg', t: 'شرائح العملاء', ic: 'users', h: ['مشغّلو 10–40 طائرة', 'عُمان والخليج'],
    d: 'شركات الطيران الإقليمية، ومؤجرو الطائرات، ومزودو MRO الذين يديرون 10–40 طائرة في عُمان ودول الخليج.' },
  { a: 'rel', t: 'علاقات العملاء', ic: 'chat', h: ['عرض تجريبي مباشر', 'دعم مخصّص'],
    d: 'عرض تجريبي مباشر (Demo Mode) لكل عميل محتمل، ودعم فني مخصّص خلال التجربة الأولى، ونموذج اشتراك سنوي مع مراجعات دورية.' },
  { a: 'chn', t: 'القنوات', ic: 'megaphone', h: ['مؤتمرات الطيران', 'شراكات مباشرة'],
    d: 'مؤتمرات الطيران الخليجية، وشراكات مباشرة مع شركات الطيران العُمانية، وتوصيات من عملاء تجريبيين أوائل.' },
  { a: 'val', t: 'القيمة المقترحة', ic: 'gem', h: ['توصية موحّدة خلال دقائق', 'شفافة بالكامل', 'القرار للمهندس'],
    d: 'توصية صيانة موحّدة (فريق محلي أم MRO متعاقد) خلال دقائق بدل أيام، بشفافية كاملة في الأسباب والأدلة، مع بقاء القرار النهائي بيد المهندس المعتمد.' },
  { a: 'act', t: 'الأنشطة الرئيسية', ic: 'cpu', h: ['نماذج التنبؤ', 'تكاملات ERP والعقود'],
    d: 'تطوير وتدريب نماذج التنبؤ بالأعطال، وبناء وصيانة تكاملات العقود/ERP، وتشغيل عمليات الموافقة البشرية والتدقيق.' },
  { a: 'res', t: 'الموارد الرئيسية', ic: 'database', h: ['بيانات صيانة تاريخية', 'فريق AI + طيران'],
    d: 'بيانات صيانة تاريخية، وفريق هندسة ذكاء اصطناعي وطيران، وشراكات بيانات مع موردي القطع وشركات MRO.' },
  { a: 'par', t: 'الشراكات الرئيسية', ic: 'handshake', h: ['موردو القطع', 'MRO كشركاء بيانات', 'سحابة محلية'],
    d: 'موردو قطع الغيار الإقليميون، وشركات MRO متعاقدة (كشركاء بيانات وليس منافسين)، ومزوّد سحابي محلي لضمان سيادة البيانات.' },
  { a: 'rev', t: 'مصادر الإيرادات', ic: 'dollar', h: ['اشتراك SaaS لكل طائرة شهرياً', 'رسوم تكامل · باقة مؤسسية'],
    d: 'اشتراك شهري لكل طائرة مُدارة (SaaS)، ورسوم تكامل أولية، مع باقة مؤسسية للأساطيل الكبيرة.' },
  { a: 'cst', t: 'هيكل التكاليف', ic: 'receipt', h: ['النماذج والتكاملات', 'استضافة آمنة · دعم · امتثال'],
    d: 'تطوير وصيانة النماذج والتكاملات، واستضافة سحابية آمنة، وفريق دعم فني وهندسي، وتكاليف الامتثال والأمن السيبراني.' },
];

export default {
  id: 'bmc',
  title: 'نموذج العمل التجاري',
  chapter: 'نموذج العمل',
  steps: 2,
  notes: `نموذج العمل (Business Model Canvas). انقر أي خانة لعرض تفاصيلها.
القيمة: توصية موحّدة خلال دقائق، شفافة، والقرار للمهندس.
الإيرادات: اشتراك SaaS شهري لكل طائرة مُدارة + رسوم تكامل أولية + باقة مؤسسية.
التكاليف: النماذج والتكاملات، الاستضافة الآمنة، الدعم، الامتثال والأمن السيبراني.
ملاحظة: في الملف الأصلي كان نصّا "هيكلة التكاليف" و"مصادر الإيرادات" متبادلين — صُحّحا هنا.
الخطوة 2: إبراز القيمة ← الإيراد.`,
  html: () => `
    <div class="eyebrow" data-in="0">نموذج العمل</div>
    <h2 class="t-l" data-in="0" style="--d:100">نموذج العمل التجاري</h2>
    <div class="bmc">
      ${BLOCKS.map((b, i) => `
        <button class="bmc-b glass bmc-${b.a}" data-i="${i}" data-in="0" style="--d:${200 + i * 70};grid-area:${b.a}">
          <span class="bmc-t">${icon(b.ic, 28)}${b.t}</span>
          <span class="bmc-h">${b.h.map((x) => `<span>${x}</span>`).join('')}</span>
          <span class="bmc-more">${icon('info', 22)}</span>
        </button>`).join('')}
    </div>
    <div class="pop bmc-pop" data-k="pop"></div>
  `,
  mount(el) {
    const pop = $(el, '[data-k="pop"]');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.bmc-b');
      if (!b) { pop.classList.remove('show'); $$(el, '.bmc-b').forEach((x) => x.classList.remove('sel')); return; }
      const d = BLOCKS[+b.dataset.i];
      const was = b.classList.contains('sel');
      $$(el, '.bmc-b').forEach((x) => x.classList.remove('sel'));
      if (was) { pop.classList.remove('show'); return; }
      b.classList.add('sel');
      pop.innerHTML = `<h4>${icon(d.ic, 26)} ${d.t}</h4><p>${d.d}</p>`;
      pop.classList.add('show');
    });
    this.el = el;
  },
  step(s, el) { el.classList.toggle('focus', s === 1); },
  leave(el) { $(el, '[data-k="pop"]').classList.remove('show'); $$(el, '.bmc-b').forEach((x) => x.classList.remove('sel')); },
};
