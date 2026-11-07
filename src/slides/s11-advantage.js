import { icon } from '../icons.js';

const ROWS = [
  { k: 'يقارن الفريق المحلي ⟷ المتعاقد', a: true, g: null },
  { k: 'مصمّم لسياق الخليج وعُمان', a: true, g: 'مصمّم لأمريكا / أوروبا' },
  { k: 'توصية موحّدة: تنبؤ + قطع + عقد + فريق', a: true, g: 'كل مجال منفصل' },
  { k: 'منطق شفاف', a: true, g: 'غالباً صندوق أسود' },
  { k: 'تكلفة وتعقيد التكامل', aText: 'مناسب للأساطيل المتوسطة', g: 'تكامل صعب ومكلف' },
];

const yes = `<span class="av-yes"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><path d="M12 20.5l5.5 5.5L28.5 15"/></svg></span>`;
const no = `<span class="av-no">${icon('x', 24)}</span>`;

export default {
  id: 'advantage',
  title: 'لماذا AVYRA؟',
  chapter: 'الميزة التنافسية',
  steps: 1,
  notes: `لماذا نحن ولا أحد غيرنا (الميزة التنافسية) — مقارنة مع الحلول العالمية:
• يقارن فريق محلي مقابل متعاقد: AVYRA ✓ — الحلول العالمية ✗
• مصمّم لسياق الخليج/عُمان: ✓ — ✗ (مصمّم لأمريكا/أوروبا)
• توصية موحّدة (تنبؤ + قطع + عقد + فريق): ✓ — ✗ (كل مجال منفصل)
• منطق شفاف قابل للتفسير: ✓ — ✗ (غالباً صندوق أسود)
• تكلفة وتعقيد التكامل: مناسب للأساطيل المتوسطة — تكامل صعب ومكلف.
أساس المقارنة: تقييم الفريق للمواد المنشورة عن أنظمة MRO العالمية الرائجة (AMOS من Swiss AviationSoftware، TRAX التي استحوذت عليها AAR في 2023 بـ 120 مليون $، IFS Maintenix، Ramco Aviation).
مراجع السوق: Oliver Wyman (Global Fleet & MRO Market Forecast 2026–2036)، Global Market Insights (Aviation MRO Software)، AAR (TRAX Acquisition).`,
  html: () => `
    <div class="eyebrow" data-in="0">الميزة التنافسية</div>
    <h2 class="t-l" data-in="0" style="--d:100">لماذا نحن… <span class="grad">ولا أحد غيرنا؟</span></h2>
    <div class="av-table">
      <div class="av-col-hl" data-in="0" style="--d:250"></div>
      <div class="av-head" data-in="0" style="--d:200">
        <span>المعيار</span>
        <span class="av-brand">AVYRA</span>
        <span>الحلول العالمية</span>
      </div>
      ${ROWS.map((r, i) => `
        <div class="av-row" data-in="0" style="--d:${400 + i * 160};--i:${i}">
          <span class="av-k">${r.k}</span>
          <span class="av-a">${r.a ? yes : `<b>${r.aText}</b>`}</span>
          <span class="av-g">${r.g === undefined ? '' : r.a ? no : ''}${r.g ? `<em>${r.g}</em>` : ''}</span>
        </div>`).join('')}
    </div>
    <p class="av-src small" data-in="0" style="--d:1300">${icon('info', 20)} قارنّا مع: <span class="ltr">AMOS · TRAX · IFS Maintenix · Ramco</span> — من موادها المنشورة</p>
  `,
};
