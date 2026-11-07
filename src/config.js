// ─────────────────────────────────────────────────────────────
//  Editable content. Anything left empty is hidden on screen —
//  no placeholder brackets ever reach the audience.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  team: [
    { name: 'رحاب الناعبية', role: 'المدير التنفيذي', bio: '', photo: '' },
    { name: 'المعتصم الوهيبي', role: 'مدير العمليات', bio: '', photo: '' },
    { name: 'فيصل البوسعيدي', role: '', bio: '', photo: '' },
  ],

  // Funding ask. amount is free text (e.g. '150,000 ر.ع.'); amountValue (number, OMR)
  // lets the use‑of‑funds chart show per‑category amounts.
  // runway: the source deck shows «[12-18]» in placeholder brackets, like [X] and [%نسبة].
  // Fill it (e.g. '12–18') only once the team confirms it.
  // Investment snapshot (OMR): 75K for 20% → pre-money 300K, post-money 375K.
  ask: { amount: '75,000 ر.ع.', amountValue: 75000, equity: '20%', preMoney: '300,000 ر.ع.', postMoney: '375,000 ر.ع.', runway: '' },

  contact: { email: '', web: '' },

  // Illustrative 3‑year model (adjustable live on the slide).
  // 300 OMR is an assumed price that still needs commercial validation.
  // Year 3 = 12 customers × 20 aircraft × 300 × 12 = 864,000 OMR (the deck's 3‑year target).
  model: {
    price: 300, // OMR per managed aircraft per month (SaaS) — assumption
    fleet: 20, // average aircraft per customer
    customers: [2, 6, 12], // year 1, 2, 3
  },
};
