import { icon } from '../icons.js';
import { BASE } from './util.js';

export default {
  id: 'hero',
  title: 'AVYRA',
  chapter: '',
  hideBrand: true,
  three: 'hero',
  notes: `افتتاح: AVYRA — ذكاء اصطناعي يقرّر لصيانة الطائرات.
السؤال الذي نجيب عنه: عند حدوث عطل غير مجدول — هل يُصلحه الفريق المحلي أم مزوّد MRO متعاقد؟ نجيب خلال دقائق بدل أيام.
الشعار: Smarter Maintenance, Faster Decisions.
(يمكن سحب الطائرة لتدويرها — نقر مزدوج لإعادة الضبط.)`,
  html: () => `
    <div class="hero">
      <img class="hero-badge" data-in="0" style="--d:150" src="${BASE}assets/logo-badge.png" alt="AVYRA">
      <h1 class="wordmark grad" data-in="0" style="--d:300">AVYRA</h1>
      <p class="hero-en" data-in="0" style="--d:480">Smarter Maintenance, Faster Decisions</p>
      <p class="hero-ar" data-in="0" style="--d:650">ذكاء اصطناعي يقرّر لصيانة الطائرات</p>
      <p class="hero-q" data-in="0" style="--d:820">فريق محلي أم متعاقد؟ <span class="grad">خلال دقائق.</span></p>
    </div>
    <div class="hint hero-hint" data-in="0" style="--d:2400">${icon('rotate')} اسحب لتدوير الطائرة</div>
  `,
};
