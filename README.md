# DR TEC Daily Report PWA (Starter)

A responsive React PWA for preparing daily reports for DR TEC COMPUTERS – ALTALLAH BRANCH.

## Included
- Separate Excel and previous WhatsApp screenshot areas.
- Desktop clipboard image paste via Ctrl+V / Cmd+V when the browser delivers image clipboard data to the page.
- Upload/camera image picker and clipboard Paste button where supported.
- Manual entry fields for today's cash, bank, profit, previous monthly totals, expenses, and closing balance.
- Monthly calculations and WhatsApp report formatting.
- Independent Copy Report and Copy Calculations buttons.
- Responsive layout and PWA manifest/service worker.
- Uploaded/pasted image data is held in React page memory only and is not uploaded or written to persistent browser storage by this app.

## Important limitations
**OCR/AI vision is not integrated in this starter.** The images are previews only; the user must read and enter the figures into the verification fields. This is deliberate so the app does not invent numbers. For automatic image reading, integrate a real OCR/vision backend, keep API keys server-side, and disclose any image transmission to that provider.

The "Save report text for this session" button stores report text only in React memory; it does not save across refreshes. It is optional and no automatic saving occurs.

## Run locally
1. Install Node.js (LTS).
2. Extract this ZIP and open the project folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

## Build
- Run `npm run build`.
- Deploy the generated `dist` folder to a static hosting provider that supports HTTPS (for example, Netlify, Vercel, or Cloudflare Pages).
- The deployed site can be installed as a PWA. Clipboard access and service-worker installation generally require HTTPS or localhost.

## Before production use
- Add real OCR/AI vision if automatic image reading is required.
- Test clipboard paste on the exact browsers/devices used in the shop.
- Verify the month rollover rule and all report amounts against the actual Excel sheet.
- Review hosting and external-service privacy policies before uploading any financial images.
# DAILY-REPORT
