# Weather Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page weather app that searches a location and shows current conditions plus the previous and next 24 hours.

**Architecture:** One Vite React TypeScript page calls Visual Crossing directly with browser `fetch`. A small pure function selects the location-relative hourly window; local React state owns request and display state.

**Tech Stack:** Vite, React, TypeScript, CSS, browser APIs, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-08-25-weather-web-app-design.md`

## Global Constraints

- Use `VITE_VISUAL_CROSSING_API_KEY` from `.env`; commit only `.env.example`.
- Use metric units: Celsius and kilometres per hour.
- Use `datetimeEpoch` and the response timezone.
- Use Swiss Industrial Print colors: `#F4F4F0`, `#111111`, and `#E61919` only.
- Use square corners, visible grid lines, CSS transitions, and no UI, state, date, fetch, routing, or animation dependency.
- Preserve prior successful data after later request failures.
- Respect accessibility basics and `prefers-reduced-motion`.

---

## File Map

- `package.json`: scripts and the existing Vite/React development dependencies.
- `index.html`: Vite entry document.
- `src/main.tsx`: React mount only.
- `src/App.tsx`: request lifecycle, response transformation, and page markup.
- `src/weather.ts`: API response types and pure 48-hour selection function.
- `src/weather.test.ts`: one focused Node test for the non-trivial range logic.
- `src/styles.css`: complete responsive industrial-brutalist presentation.
- `.env.example`: API key contract.
- `.gitignore`: excludes local environment and build files.

### Task 1: Scaffold and verify the app shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Consumes: none
- Produces: a runnable Vite React TypeScript shell and `VITE_VISUAL_CROSSING_API_KEY` configuration contract

- [ ] **Step 1: Scaffold with the official Vite template**

Run:

```bash
npm create vite@latest /tmp/weather-vite -- --template react-ts
cp -r /tmp/weather-vite/.gitignore /tmp/weather-vite/eslint.config.js /tmp/weather-vite/index.html /tmp/weather-vite/package.json /tmp/weather-vite/public /tmp/weather-vite/src /tmp/weather-vite/tsconfig.app.json /tmp/weather-vite/tsconfig.json /tmp/weather-vite/tsconfig.node.json /tmp/weather-vite/vite.config.ts .
rm -rf /tmp/weather-vite
npm install
```

Expected: dependencies install successfully and `src/` contains the Vite React template.

- [ ] **Step 2: Replace the demo with the minimum shell**

`src/App.tsx`:

```tsx
import './styles.css'

export default function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">LIVE ATMOSPHERIC TELEMETRY</p>
        <h1>WEATHER<br />OUTLOOK</h1>
      </header>
      <form className="search">
        <label htmlFor="location">LOCATION</label>
        <input id="location" name="location" required placeholder="JAKARTA" />
        <button type="submit">SEARCH</button>
      </form>
    </main>
  )
}
```

Delete `src/App.css`, `src/index.css`, and unused template assets. In `src/main.tsx`, retain only the React mount and `App` import. Create `.env.example`:

```dotenv
VITE_VISUAL_CROSSING_API_KEY=replace_with_your_key
```

Ensure `.gitignore` contains:

```gitignore
node_modules
dist
.env
```

- [ ] **Step 3: Add the minimum base CSS**

`src/styles.css`:

```css
:root { font-family: Arial, Helvetica, sans-serif; color: #111; background: #f4f4f0; }
* { box-sizing: border-box; }
body { margin: 0; }
button, input { border: 0; border-radius: 0; font: inherit; }
button { cursor: pointer; }
main { min-height: 100vh; padding: clamp(1rem, 3vw, 3rem); }
header { border: 2px solid #111; padding: 1rem; }
.eyebrow, label { font: 700 .75rem/1.2 monospace; letter-spacing: .08em; }
h1 { margin: 2rem 0 0; font-size: clamp(4rem, 12vw, 11rem); line-height: .82; letter-spacing: -.06em; }
.search { display: grid; grid-template-columns: auto 1fr auto; border: 2px solid #111; border-top: 0; }
.search > * { padding: 1rem; }
.search input { min-width: 0; border-inline: 2px solid #111; background: transparent; }
.search button { color: #f4f4f0; background: #111; font-weight: 800; }
.search button:hover, .search button:focus-visible { background: #e61919; }
:focus-visible { outline: 3px solid #e61919; outline-offset: -3px; }
@media (max-width: 600px) { .search { grid-template-columns: 1fr; } .search input { border: 0; border-block: 2px solid #111; } }
```

- [ ] **Step 4: Verify the shell**

Run:

```bash
npm run build
```

Expected: exit code 0 and `dist/` is created.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json index.html src .gitignore .env.example eslint.config.js tsconfig*.json vite.config.ts public
git commit -m "chore: scaffold weather app"
```

### Task 2: Select the location-relative hourly window

**Files:**
- Create: `src/weather.ts`
- Create: `src/weather.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: hourly Visual Crossing records with `datetimeEpoch`
- Produces: `selectHourlyWindow(hours: Hour[], nowEpoch: number): Hour[]`

- [ ] **Step 1: Add a failing focused test using Node's built-in runner**

`src/weather.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { selectHourlyWindow, type Hour } from './weather.ts'

const hour = (datetimeEpoch: number): Hour => ({
  datetimeEpoch,
  temp: 20,
  windspeed: 5,
  precipprob: null,
  conditions: 'Clear',
})

test('sorts and keeps only the inclusive previous/next 24 hours', () => {
  const now = 100_000
  const hours = [now + 86_401, now, now - 86_400, now + 3_600, now - 86_401, now + 86_400].map(hour)
  assert.deepEqual(
    selectHourlyWindow(hours, now).map(({ datetimeEpoch }) => datetimeEpoch),
    [now - 86_400, now, now + 3_600, now + 86_400],
  )
})
```

Add to `package.json` scripts:

```json
"test": "node --experimental-strip-types --test src/weather.test.ts",
"typecheck": "tsc -b"
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
npm test
```

Expected: FAIL because `src/weather.ts` does not exist.

- [ ] **Step 3: Implement the minimum pure function and API types**

`src/weather.ts`:

```ts
export type Hour = {
  datetimeEpoch: number
  temp: number
  windspeed: number
  precipprob: number | null
  conditions: string
}

export type WeatherResponse = {
  resolvedAddress: string
  timezone: string
  currentConditions: Hour
  days: Array<{ hours: Hour[] }>
}

const DAY = 24 * 60 * 60

export function selectHourlyWindow(hours: Hour[], nowEpoch: number) {
  return hours
    .filter(({ datetimeEpoch }) => Math.abs(datetimeEpoch - nowEpoch) <= DAY)
    .sort((a, b) => a.datetimeEpoch - b.datetimeEpoch)
}
```

- [ ] **Step 4: Verify test and typecheck**

Run:

```bash
npm test
npm run typecheck
```

Expected: both commands exit 0; test reports one pass.

- [ ] **Step 5: Commit**

```bash
git add package.json src/weather.ts src/weather.test.ts
git commit -m "test: define hourly weather window"
```

### Task 3: Fetch and render weather data

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `WeatherResponse`, `Hour`, and `selectHourlyWindow` from `src/weather.ts`
- Produces: searchable current conditions, refresh, accessible errors, and a scrollable 48-hour timeline

- [ ] **Step 1: Implement request state and the latest-request-wins flow**

Replace `src/App.tsx` with a component that:

```tsx
import { FormEvent, useRef, useState } from 'react'
import { selectHourlyWindow, type Hour, type WeatherResponse } from './weather'
import './styles.css'

type Weather = WeatherResponse & { hours: Hour[] }

export default function App() {
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [lastLocation, setLastLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)

  async function load(query: string) {
    const key = import.meta.env.VITE_VISUAL_CROSSING_API_KEY
    if (!key) return setError('Missing VITE_VISUAL_CROSSING_API_KEY in .env.')
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    try {
      const encoded = encodeURIComponent(query.trim())
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encoded}?unitGroup=metric&include=current,hours&key=${encodeURIComponent(key)}&contentType=json`
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(response.status === 400 ? 'Location not found.' : `Weather service failed (${response.status}).`)
      const data = await response.json() as WeatherResponse
      if (!data.currentConditions || !Array.isArray(data.days)) throw new Error('Weather service returned invalid data.')
      const hours = selectHourlyWindow(data.days.flatMap(({ hours }) => hours), data.currentConditions.datetimeEpoch)
      setWeather({ ...data, hours })
      setLastLocation(query.trim())
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof Error ? cause.message : 'Could not load weather.')
    } finally {
      if (request.current === controller) setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void load(location)
  }
```

Complete the JSX with the approved shell, controlled input, submit handler, loading/error live regions, conditional summary, refresh button calling `load(lastLocation)`, and timeline list. Format timeline labels with:

```tsx
const time = (epoch: number, timezone: string) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: timezone,
}).format(epoch * 1000)
```

Render `precipprob == null ? '—' : `${Math.round(precipprob)}%``. Add `aria-current="time"` to the closest record at or after `currentConditions.datetimeEpoch`.

- [ ] **Step 2: Complete the approved grid styling**

Extend `src/styles.css` with:

```css
.status { min-height: 3rem; border-inline: 2px solid #111; padding: 1rem; font: 700 .75rem monospace; }
.error { color: #e61919; }
.dashboard { border: 2px solid #111; animation: enter .25s ease-out; }
.location-bar, .timeline-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 2px solid #111; }
.location-bar h2 { margin: 0; font-size: clamp(1.5rem, 4vw, 4rem); text-transform: uppercase; }
.refresh { padding: .8rem 1rem; color: #f4f4f0; background: #111; font-weight: 800; }
.refresh:hover, .refresh:focus-visible { background: #e61919; }
.summary { display: grid; grid-template-columns: 2fr repeat(3, 1fr); }
.metric { min-height: 10rem; padding: 1rem; border-right: 2px solid #111; }
.metric:last-child { border: 0; }
.metric dt { font: 700 .7rem monospace; letter-spacing: .08em; }
.metric dd { margin: 1rem 0 0; font: 800 clamp(1.5rem, 4vw, 4rem)/.9 Arial, sans-serif; }
.timeline-head { border-top: 2px solid #111; font: 700 .75rem monospace; }
.timeline { display: flex; margin: 0; padding: 0; overflow-x: auto; list-style: none; border-top: 2px solid #111; }
.hour { flex: 0 0 9rem; min-height: 12rem; padding: 1rem; border-right: 1px solid #111; font-family: monospace; }
.hour[aria-current="time"] { color: #f4f4f0; background: #e61919; }
.hour strong { display: block; margin: 2rem 0 .5rem; font: 800 2rem Arial, sans-serif; }
button:disabled { cursor: wait; opacity: .55; }
@keyframes enter { from { opacity: 0; transform: translateY(8px); } }
@media (max-width: 800px) { .summary { grid-template-columns: 1fr 1fr; } .metric:nth-child(2) { border-right: 0; } .metric:nth-child(-n+2) { border-bottom: 2px solid #111; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
```

Keep the macro heading to at most two lines and all clickable controls visibly focused.

- [ ] **Step 3: Verify static checks and production build**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add weather search and timeline"
```

### Task 4: Browser smoke test and final cleanup

**Files:**
- Modify only files implicated by observed defects

**Interfaces:**
- Consumes: completed application and a valid `.env` key
- Produces: verified desktop/mobile behavior with no console failures

- [ ] **Step 1: Configure the local key without committing it**

```bash
cp .env.example .env
```

Replace `replace_with_your_key` in `.env` with the user's Visual Crossing key. Never print or commit the key.

- [ ] **Step 2: Start the development server**

Run in a tracked background process:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL and remains running.

- [ ] **Step 3: Smoke-test in a real browser**

Verify:

1. Initial page sends no weather request and shows no dashboard.
2. Empty submit triggers native required validation.
3. A valid location shows summary and hourly cards on desktop and narrow viewport.
4. Hour labels use the searched location's timezone; rain `null` displays `—`.
5. Refresh repeats the successful location and disables controls while loading.
6. Invalid search shows an accessible error while prior successful data remains.
7. Rapid searches leave only the newest response visible.
8. Keyboard focus is visible and the timeline scrolls horizontally.
9. Browser console contains no application errors.

- [ ] **Step 4: Re-run final verification after any smoke-test fix**

```bash
npm test
npm run typecheck
npm run lint
npm run build
git status --short
```

Expected: checks pass; only deliberate uncommitted fixes appear and `.env` is absent from status.

- [ ] **Step 5: Commit smoke-test fixes if needed**

```bash
git add src
# Run only when files changed:
git commit -m "fix: address weather app smoke test findings"
```
