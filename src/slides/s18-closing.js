import { icon } from '../icons.js';
import { BASE } from './util.js';

export default {
  id: 'closing',
  title: 'من أيام إلى دقائق',
  chapter: '',
  hideBrand: true,
  three: 'closing',
  notes: `الختام: من أيام إلى دقائق — قرار صيانة واحد، موثوق، وشفاف لكل طائرة في الخليج.
Smarter Maintenance, Faster Decisions.
للأسئلة: افتح "اسأل AVYRA" (مفتاح A) — يجيب من محتوى العرض ويأخذك إلى الشريحة المناسبة.`,
  html: ({ config }) => `
    <div class="cl">
      <img class="cl-logo" data-in="0" style="--d:2600" src="${BASE}assets/logo-full.png" alt="AVYRA — AI for Sustainable Aviation">
      <h2 class="t-xl" data-in="0" style="--d:3000">من أيام <span class="grad">إلى دقائق.</span></h2>
      <p class="lead" data-in="0" style="--d:3250">قرار صيانة واحد، موثوق، وشفاف — لكل طائرة في الخليج.</p>
      <p class="cl-en" data-in="0" style="--d:3450">Smarter Maintenance, Faster Decisions</p>
      ${config.contact.email || config.contact.web ? `<p class="cl-contact ltr" data-in="0" style="--d:3600">${[config.contact.email, config.contact.web].filter(Boolean).join('  ·  ')}</p>` : ''}
      <div class="cl-act" data-in="0" style="--d:3700">
        <button class="btn primary" data-k="ask">${icon('chat', 28)} اسأل AVYRA</button>
        <span class="cl-thanks">شكراً لكم</span>
      </div>
    </div>
  `,
  mount(el, ctx) {
    el.querySelector('[data-k="ask"]').addEventListener('click', () => ctx.assistant?.open());
  },
  enter(el, ctx) { ctx.stage3d.takeoff(0.5); },
  leave(el, ctx) { ctx.stage3d.resetFlight(); },
};
