# AVYRA — Interactive Pitch Presentation

Smarter Maintenance, Faster Decisions. An Arabic (RTL) interactive presentation built with Vite, Three.js and GSAP.

## Run

```bash
npm install
npm run dev
```

## Presenting

| Key | Action |
| --- | --- |
| → / Space / PgDn | Next step / slide |
| ← / PgUp | Previous |
| 1–17 then Enter | Jump to slide |
| O | All slides |
| F / F5 | Full screen (F5 from a presenter remote no longer reloads the page) |
| A | "Ask AVYRA" Q&A assistant |
| S | Presenter window (notes, timer, next slide) |
| R | Replay current slide |
| B / . | Black screen (Esc returns) |
| Esc | Close help / assistant / overview / black screen (never opens anything) |

A presenter remote's keys (PgDn / PgUp / F5 / B / Esc) work whatever is open or focused — the Ask AVYRA panel, its text field, the slide grid — and also when the presenter window has focus. Moving the deck closes the panel or grid.

Deploy updates to GitHub Pages with `npm run deploy`.

Before an event, run `npm run qa` (needs Chrome): it builds, walks every slide/step in headless Chrome, checks keyboard/clicker flow, legibility (no text under 22 px), text budget per slide, layout, simulation labels, the adaptive 3D resolution and the Q&A agent (125 judge-style questions in `scripts/qa/questions.mjs`), and saves a screenshot of every state in `.qa/`. Set `CHROME=<path>` if Chrome is not in the default Windows location.

Editable content (team roles/bios, funding amount, contact, financial assumptions) lives in `src/config.js`. Empty fields are hidden on screen.
