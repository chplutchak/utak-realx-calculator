# REALx Calculator

UTAK's free QC cost calculator. Surfaces three hidden costs of in-house QC: rework, compliance, and vendor/training. Plus the opportunity cost of those hours.

## Deploy to Render

This is a Vite + React static site.

**Render service settings:**
- Service type: **Static Site**
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Auto-Deploy: On

That's it. Render runs `npm install` on its own servers, builds the project, and serves the static files from the `dist` folder.

## Local development (optional)

If you ever want to run this locally:

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

Note: HubSpot form submissions will fail from localhost due to CORS. To test the full submission flow, you need to use the deployed Render URL.

## What's in the project

- `src/UTAKQCCalculator.jsx` — the calculator component, wired to HubSpot's Forms API
- `src/App.jsx` — root component, renders the calculator
- `src/main.jsx` — Vite entry point
- `src/index.css` — Tailwind directives
- `index.html` — HTML shell
- `tailwind.config.js` / `postcss.config.js` — Tailwind setup
- `vite.config.js` — Vite + React config
- `package.json` — dependencies

## HubSpot integration

The calculator POSTs to `api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}` when a user submits their email in the modal. Portal ID and form GUID are constants at the top of `UTAKQCCalculator.jsx`.

On successful submission, HubSpot:
1. Creates or updates a contact with all 11 REALx properties
2. Fires the workflow that sends the breakdown email
3. Fires the internal notification to Andrew
