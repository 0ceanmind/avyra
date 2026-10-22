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
  ask: { amount: '', amountValue: 0, equity: '', runway: '12–18' },

  contact: { email: '', web: '' },

  // Illustrative 3‑year model (adjustable live on the slide).
  // Price is consistent with the deck's SOM (1–3M OMR / yr for 30–50 operators × 10–40 aircraft).
  model: {
    price: 200, // OMR per managed aircraft per month (SaaS)
    fleet: 20, // average aircraft per customer
    customers: [2, 6, 12], // year 1, 2, 3
  },
};
