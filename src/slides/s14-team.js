import { BASE } from './util.js';

const initial = (name) => {
  const first = name.trim().split(/\s+/)[0] || '';
  return (first.startsWith('ال') && first.length > 3 ? first.slice(2) : first).charAt(0);
};

export default {
  id: 'team',
  title: 'الفريق',
  chapter: 'الفريق',
  steps: 1,
  notes: `الفريق — لماذا نحن الفريق المناسب لحل هذه المشكلة؟
قدّم كل عضو بسطر واحد عن خبرته السابقة ذات الصلة بالطيران / الذكاء الاصطناعي / الأعمال.
(الأدوار والنبذات تُعدَّل في src/config.js — الحقول الفارغة لا تظهر على الشاشة.)`,
  html: ({ config }) => `
    <div class="eyebrow" data-in="0">الفريق</div>
    <h2 class="t-l" data-in="0" style="--d:100">لماذا نحن الفريق المناسب؟</h2>
    <div class="tm-grid">
      ${config.team.map((m, i) => `
        <article class="tm-card glass" data-in="0" style="--d:${250 + i * 150}">
          <div class="tm-av">${m.photo ? `<img src="${m.photo.startsWith('http') ? m.photo : BASE + m.photo}" alt="${m.name}">` : `<span>${initial(m.name)}</span>`}</div>
          <h3>${m.name}</h3>
          ${m.role ? `<p class="tm-role">${m.role}</p>` : ''}
          ${m.bio ? `<p class="tm-bio">${m.bio}</p>` : ''}
        </article>`).join('')}
    </div>
  `,
};
