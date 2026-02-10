# JTI Fitness Tracker

A simple, modern, browser-based health tracking app built with **HTML, CSS, and JavaScript**.

## Features

- Dashboard with today’s calories/macros, workout status, latest weight, and visual indicators.
- Weight tracking with history table + trend chart.
- Food and macro logging with daily totals by selected date.
- Workout logging grouped by date and session + weekly workout count.
- AI meal scanning section (mocked locally) that pre-fills a food entry estimate.
- Local persistence via `localStorage`.
- Data export (`.json`) and clear-all utilities.

## Run locally

### Option 1: Open directly
1. Clone/download this repo.
2. Open `index.html` in your browser.

### Option 2: Serve locally (recommended)
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## AI food scanning: how it works

The app includes a **mock** AI scanner by default so it works without any backend or API key.

- In `app.js`, `analyzeMealWithAIMock()` simulates analysis and returns estimated calories/macros.
- The result is shown in the AI panel and copied into the food form as an **estimate**.
- You can edit the values before saving.

### Plug in a real ChatGPT-style vision endpoint

All AI config is centralized at the top of `app.js` in `AI_CONFIG`:
- `API_BASE_URL`
- `MODEL`
- `API_KEY`
- `ENDPOINT_PATH`

To use a real API:
1. Update `AI_CONFIG` with your endpoint/model/key.
2. In `handleAIScanSubmit`, replace:
   - `analyzeMealWithAIMock(file)`
   with
   - `analyzeMealWithAIRealApi(file)`

`analyzeMealWithAIRealApi()` includes a commented example `fetch` payload and response parsing that you can customize to your provider’s schema.

> ⚠️ Never commit real API keys to GitHub. Use environment variables or a backend proxy in production.
