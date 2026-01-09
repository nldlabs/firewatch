# VIC Fire Watch

Real-time fire emergency tracker for Victoria, Australia. This is a portfolio project that demonstrates mapping, geolocation, and proximity alerts using public VIC Emergency data.

Important: This is not an official emergency tool. Always refer to the official source at https://emergency.vic.gov.au and call 000 in an emergency.

## Features
- Leaflet-based map with warning polygons and markers
- Geolocation-based proximity alerts (local-only)
- Status panel with total areas under warnings
- Simple polling with delta checks to reduce fetches

## Architecture & Tradeoffs (YAGNI)
- Client-only: No backend/proxy to keep deployment simple. Reliant on third-party uptime and CORS.
- Polling: 15s interval with delta hashing instead of websockets/SSE (not provided by source).
- No persistence: User location and alerts are not stored or sent anywhere.
- No clustering/virtualization: Adequate for current data scale; can be added later.
- Minimal lint/test setup: ESLint enabled; tests omitted for portfolio scope.

## Privacy
- Geolocation is optional and stays in the browser.
- No analytics, cookies, or tracking.
- No API keys or secrets.

## Data Source
- VIC Emergency public endpoints:
  - Delta: https://emergency.vic.gov.au/public/osom-delta.json
  - Events: https://emergency.vic.gov.au/public/events-geojson.json

## Getting Started

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Deployment Notes
- Static hosting friendly (Vite build output).
- Ensure HTTPS so geolocation works reliably on browsers.
- Consider adding a simple cache/proxy if CORS or uptime becomes an issue.

### GitHub Pages
- CI deploy is configured in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) to publish `main` to GitHub Pages.
- The workflow sets `BASE_PATH` automatically for project pages (e.g., `/repo/`) and `/` for user/org pages (`<user>.github.io`).
- If your Pages site fails to route assets, verify the `BASE_PATH` env and the `base` setting in [vite.config.ts](vite.config.ts).

## Roadmap / Future Work
- Add unit tests for geo utilities and hooks.
- Improve a11y on map interactions and dialog controls.
- Optional offline cache and service worker for PWA.
- Event clustering/virtualization if dataset grows.

## Disclaimer
This application is for portfolio demonstration only. For official warnings and instructions, visit https://emergency.vic.gov.au.
