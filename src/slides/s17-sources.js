import { icon } from '../icons.js';

// Research sources behind the study's market and valuation figures.
const SOURCES = [
  { org: 'Oliver Wyman', doc: 'Global Fleet & MRO Market Forecast 2026–2036', use: 'حجم سوق صيانة الطائرات', fig: '$136B · 2025' },
  { org: 'Global Market Insights', doc: 'Aviation MRO Software Market', use: 'حجم سوق برمجيات MRO', fig: '$7.6B · 2025' },
  { org: 'Mordor Intelligence', doc: 'GCC Aircraft MRO Market', use: 'السوق الخليجي', fig: '$5.0B · 2026' },
  { org: 'AAR', doc: 'TRAX Acquisition · 2023', use: 'صفقة استحواذ حقيقية في القطاع', fig: '$120M' },
  { org: 'Aventis Advisors', doc: 'SaaS Valuation Multiples', use: 'مرجع لمقارنة تقييم شركات البرمجيات', fig: '4.5× Revenue' },
];

export default {
  id: 'sources',
  title: 'المصادر البحثية',
  chapter: 'المصادر',
  steps: 1,
  notes: `المصادر البحثية التي تستند إليها الدراسة:
1. Oliver Wyman — Global Fleet & MRO Market Forecast 2026–2036: الطلب العالمي على MRO بلغ 136 مليار $ في 2025 (+8% عن 2024).
2. Global Market Insights — Aviation MRO Software: 7.62 مليار $ في 2025، نمو 4.2% سنوياً (2026–2035).
3. Mordor Intelligence — GCC Aircraft MRO: 5.02 مليار $ في 2026 ← 8.87 مليار $ في 2032، نمو 10.03% سنوياً.
4. AAR — TRAX Acquisition (مارس 2023): 120 مليون $ نقداً + حتى 20 مليون $ مدفوعات مشروطة — دليل على قيمة برمجيات MRO.
5. SaaS Valuation Multiples — Aventis Advisors: الوسيط ≈ 4.5× الإيرادات عبر 543 صفقة استحواذ SaaS منذ 2015.
الأرقام من صفحات الملخص المنشورة لكل تقرير.`,
  html: () => `
    <div class="eyebrow" data-in="0">المراجع</div>
    <h2 class="t-l" data-in="0" style="--d:100">المصادر البحثية</h2>
    <p class="lead" data-in="0" style="--d:200">التي تستند إليها الدراسة</p>
    <ol class="src-list">
      ${SOURCES.map((s, i) => `
        <li class="src-row" data-in="0" style="--d:${300 + i * 120}">
          <span class="src-n num">${i + 1}</span>
          <div class="src-t"><b class="ltr">${s.org}</b><span class="ltr">${s.doc}</span></div>
          <span class="src-use">${icon('link', 22)} ${s.use}</span>
          <b class="src-fig num${/[؀-ۿ]/.test(s.fig) ? "" : " ltr"}">${s.fig}</b>
        </li>`).join('')}
    </ol>
  `,
};
