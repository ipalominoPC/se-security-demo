# Codex handoff: frontend styling for Demo 1 (SMB Security Posture Assessment)

Owner of this step: Codex (all frontend design and styles). Working logic is done and tested. Do not change the data or the logic.

## Status

- Working: landing hero (pain-first), sample report, 12-question flow (6 domain screens, 2 questions each), scoring, rating cap, findings, 30/60/90 plan, report with biggest pain and top-3 value estimate, Download report.
- Tested: scripted walkthrough covers the landing page, all six domain screens, Back, submit validation, report render, the download file, and Start over. No page errors.
- Public link: GitHub Pages is not yet enabled. Isaac enables it in repo settings (Settings > Pages > Deploy from a branch > main / root).

## Keep these hooks (the walkthrough and the flow depend on them)

Element IDs used by js/app.js:
- `app` (root container), `start-btn`, `question-form`, `form-error`, `back-btn`, `next-btn`, `cancel-btn`
- `download-sample-btn` (landing), `download-btn` (report), `restart-btn` (report)
- `report-view` (where the report body renders)

Form inputs: radio inputs named by question id, values `yes`, `partly`, `no`. Each question sits in a `<fieldset>` with a `<legend>`.

## Rules for the design

1. No invented numbers. Every figure comes from data/impact-sources.js or data/findings.js. Do not edit figures or source links.
2. Keep every scope label next to its figure (SMB, all sizes, US, global, context only). Keep the "Estimate" label where the figure is marked as an estimate.
3. Keep the report's order: biggest pain and top-3 value first, then the overall score, then the domain table, top 3 findings, and the 30/60/90 plan.
4. The hero leads with pain. The headline is the pain question. Do not move the tool above the pain.
5. The downloaded file must stay standalone: no scripts, no CDN links. Inline styles are acceptable there. The report body in `js/report.js` uses inline styles today; you may move these to classes, but the download must still work offline.
6. Keep the rating colours readable: green, amber, red. Keep the red/amber/green meaning in text too, not colour alone.
7. Plain, accessible markup: labels on inputs, visible focus states, readable contrast.

## Where things are

- `index.html`: shell and script order (keep the order: data files, then scoring, then report, then app)
- `js/app.js`: landing, question flow, navigation
- `js/report.js`: report body (`renderReportBody`), download document (`renderReportDocument`)
- `js/scoring.js`: scoring and rating cap (do not change)
- `data/questions.js`: 12 questions (do not change without sign-off)
- `data/findings.js`: findings, pain lines, figures, scope labels (do not change without sign-off)
- `data/impact-sources.js`: source register and value estimate (do not change without sign-off)
- `data/remediation.js`: 30/60/90 tier text
- `assets/`: Isaac's logos and favicon

## Done when

- The walkthrough still passes after your changes (ask for the test before handing back).
- The landing hero, report order, and download file match rules 3 to 5 above.
- Styles are in the repo, and the change is pushed to `main` with the attribution lines.
