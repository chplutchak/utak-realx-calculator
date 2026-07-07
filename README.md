# REAL X — The In-House QC Cost Calculator

A React application that reveals the true cost of preparing quality controls in-house. Materials, labor, rework, compliance, vendor management, and the revenue those hours could have generated if redirected to billable testing.

Built by UTAK Laboratories. Deployed as a standalone tool for the ADLM 2026 campaign, then permanent lead capture asset thereafter.

---

## What this repo contains

```
utak-realx-calculator/
├── README.md              — this file
├── package.json           — dependencies and scripts
├── vite.config.js         — build tool config
├── tailwind.config.js     — Tailwind CSS config
├── postcss.config.js      — PostCSS config
├── index.html             — HTML entry
├── .gitignore
└── src/
    ├── main.jsx           — React entry point
    ├── App.jsx            — the calculator (single component)
    ├── config.js          — HubSpot GUIDs, sweepstakes settings, URLs
    └── index.css          — Tailwind directives
```

The calculator lives in `src/App.jsx` as one component. It is intentionally not split into smaller files. Config values that may need updating post-launch live in `src/config.js`.

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** (bundled with Node)

Check with:
```bash
node -v
npm -v
```

---

## Local development

Clone the repo, install dependencies, and start the dev server:

```bash
git clone https://github.com/<your-org>/utak-realx-calculator.git
cd utak-realx-calculator
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and hot-reloads on save.

To build a production bundle:
```bash
npm run build
```
Output goes to `dist/`. Preview the production build locally with `npm run preview`.

---

## Configuration you must update before going live

Everything that needs changing lives in **`src/config.js`**. There are four config values marked with `TODO`. All four should be resolved before the sweepstakes window opens.

### 1. HubSpot Portal ID
Already set to `21153233`. Only update if you're pointing at a different HubSpot account.

Where to find it: log into HubSpot → click your avatar top-right → "Hub ID: XXXXXXX" in the dropdown.

### 2. HubSpot Form GUID
Currently a placeholder: `'REPLACE_WITH_ACTUAL_FORM_GUID'`.

To create the form:
1. HubSpot → Marketing → Forms → Create form
2. Name it `REALx Calculator Entries`
3. Add these fields:
   - **Email** (required)
   - **First name** (required)
   - **Last name** (required)
   - **Company** (not required)
   - **Entry source** (hidden field, single-line text) — create this as a custom contact property if it doesn't exist yet, so submissions can be filtered later by sweepstakes vs. standard entries
4. Save the form
5. Actions → Embed → look for `formId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"` — that string is the GUID
6. Paste it into `HUBSPOT_FORM_GUID` in `src/config.js`

### 3. Sweepstakes rules URL
Currently `'#'` (an inert link).

Once the official rules page is published, paste the full URL into `SWEEPSTAKES_RULES_URL` in `src/config.js`. This link appears in two places: the results-section reveal button caption, and the fine print in the modal.

### 4. Sweepstakes window dates
Currently set to `2026-07-26T00:00:00` through `2026-07-30T23:59:59` (ADLM 2026 in Anaheim, browser local time).

If ADLM shifts dates or you want to run this mechanic at a different show, update `SWEEPSTAKES_START` and `SWEEPSTAKES_END`. The tool automatically flips between sweepstakes-aware copy and standard PDF-unlock copy based on whether the current time falls inside the window. No code redeploy needed to disable sweepstakes copy after the show — the window closes on its own.

---

## How the gate works

Users see the calculator inputs freely, adjust them freely, and see the direct-cost breakdown cards (materials, failure, compliance, vendor/training) freely.

The two big animated numbers — **True Annual Cost** and **Opportunity Cost** — are masked with `$———` until the user submits the gate form. A teal reveal button sits below the numbers with copy that changes based on the sweepstakes window:

- **Inside window:** "Reveal your result + enter to win $250"
- **Outside window:** "Reveal your result"

The gate modal collects first name, last name, and email (all required), plus company (optional). On submit:

1. Field validation runs (all three required fields must have content, email must contain `@`).
2. A POST goes out to the HubSpot Forms API with the form data plus a hidden `entry_source` field tagged either `REALx - ADLM 2026 Sweepstakes` or `REALx - Standard` depending on window.
3. `resultsUnlocked` state flips to true, revealing both numbers.
4. Confirmation screen shows briefly, then user clicks "See my result" to close.

HubSpot failures are swallowed silently — better UX than blocking a user on an integration hiccup. If the form GUID is invalid, submissions won't create contacts, so **verify the GUID is correct before ADLM opens**.

---

## Deployment (Render)

The current production deployment lives on Render. To deploy a new version:

```bash
git add .
git commit -m "your message"
git push origin main
```

Render auto-deploys on every push to `main`.

### Render settings (for reference or setting up fresh)

| Field | Value |
|-------|-------|
| Environment | Static Site |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Live URL will be something like `https://utak-realx.onrender.com`.

---

## Embedding in HubSpot pages or utak.com

Drop this iframe into an HTML embed module:

```html
<iframe
  src="https://utak-realx.onrender.com"
  width="100%"
  height="4200"
  frameborder="0"
  style="border: 0; display: block;"
  title="REAL X · The In-House QC Cost Calculator"
></iframe>
```

The height is deliberately high because the calculator is a long-scroll page. If you want the iframe to auto-resize, use [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer) or a similar solution — otherwise pick a fixed height that's tall enough for the full results view.

---

## Post-ADLM cleanup

The tool is designed to keep running indefinitely after the show. When the sweepstakes window closes (July 30, 2026 end of day), the code automatically:

- Drops all sweepstakes copy from the reveal button, modal, and confirmation screen
- Falls back to "Reveal your result" and standard PDF-unlock messaging
- Continues to submit to the same HubSpot form, tagged as `REALx - Standard`

You do not need to redeploy after ADLM. The window-close logic runs client-side on every page load.

---

## Sources for the math

The tool's cost model is documented in-page under "The Receipts" (an expandable section at the bottom). If you need to update or defend the numbers:

- **Failure & Rework:** 12% failure rate, based on Westgard Sigma metrics (about 26% of clinical chemistry tests fall below 3-sigma; 12% is a conservative midpoint for prep failures)
- **Compliance:** Scales with lab size — 60 hrs/year (small), 100 hrs/year (mid, default), 140 hrs/year (large). Based on CAP biennial inspection prep (3-4 month runway) plus CLIA (42 CFR Part 493) documentation. Small labs run lighter loads than reference operations like Arup or Quest.
- **Training:** CLSI QMS03 competency framework, 6 hours per preparation per person per year
- **Vendor Management:** 6 hours per preparation per year for procurement, receiving, lot release, and expiration tracking

If you change any of these constants, update both the calculation and the corresponding source citation in the same commit so The Receipts stays honest.

---

## Contact

Marketing owner: Cheyenne Plutchak · UTAK Laboratories
Deploy questions: reach out to Eric at CaliNetworks or the current web vendor of record.
