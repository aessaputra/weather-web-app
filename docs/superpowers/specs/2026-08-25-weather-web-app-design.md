# Weather Web App Design

## Scope

Build a single-page weather application with Vite, React, and TypeScript. A user searches for a location and receives current conditions plus hourly data covering the previous 24 hours and next 24 hours relative to the location's current time.

The first release excludes geolocation, routing, a backend, server-side rendering, caching libraries, animation libraries, and global state management.

## User Experience

### Initial state

The page shows the title, a labeled location search field, a submit button, and a short instruction. No weather request runs before the user searches.

### Successful search

The page shows:

- Resolved location name
- General weather condition
- Current temperature in degrees Celsius
- Wind speed in kilometres per hour
- Probability of rain
- Last update time in the searched location's timezone
- A refresh button
- An hourly timeline spanning 24 hours before and 24 hours after the location's current time

The timeline is one horizontally scrollable list with clear labels for the previous and next periods. The current hour and the boundary between past and future receive the red accent.

Refresh repeats the last successful location search. Search and refresh controls are disabled while a request is active.

## Visual Direction

Use the Swiss Industrial Print archetype from the industrial brutalist system:

- Matte off-white `#F4F4F0` background
- Carbon `#111111` foreground
- Aviation red `#E61919` as the only accent
- Rigid CSS grid, visible 1–2 px divisions, and square corners
- Large uppercase structural headings with at most two lines
- Compact monospace typography for weather data and metadata
- No gradients, shadows, glass effects, rounded cards, stock imagery, or decorative badges

Apply the useful gpt-taste constraints without turning the dashboard into a marketing page: wide typography, exact grid alignment, strong button contrast, responsive hover feedback, and restrained CSS entry transitions. Do not add GSAP, AIDA sections, marketing bento blocks, or image assets.

## Architecture

Use one React page and local component state. Keep the fetch and response transformation close to the page because there is one consumer and no established codebase pattern to reuse.

Minimum state:

- `location`: current input value
- `weather`: last successful transformed response
- `loading`: active request state
- `error`: current user-facing error
- `lastLocation`: last successful search value

Use browser-native `fetch`, `AbortController`, form validation, horizontal scrolling, and `Intl.DateTimeFormat`. Use CSS without a component or styling dependency.

The Visual Crossing key is read from `VITE_VISUAL_CROSSING_API_KEY` in `.env`. This intentionally exposes the key in the frontend bundle for this demo. Add a backend or serverless proxy only if key secrecy becomes a requirement. Commit `.env.example`, not `.env`.

## API Request and Data Flow

1. The user submits a non-empty location.
2. Abort any request still in progress.
3. Build a Visual Crossing Timeline API URL using the encoded location, `unitGroup=metric`, and hourly/current data.
4. Request a three-date range broad enough to contain the target 48-hour window.
5. Flatten hourly records from the returned days.
6. Use `currentConditions.datetimeEpoch` as the location-relative reference point.
7. Sort records by `datetimeEpoch` and keep records within 24 hours before and 24 hours after that reference.
8. Render `currentConditions` as the summary and the filtered records as the timeline.
9. Store the searched location as `lastLocation` only after success.

Epoch values provide an unambiguous comparison across timezones and daylight-saving transitions. Display labels use the response timezone through `Intl.DateTimeFormat`.

If the API returns fewer than 48 usable hourly records, show the available records. Do not synthesize missing weather data.

## Error Handling

- Native `required` validation rejects empty submissions.
- A missing `VITE_VISUAL_CROSSING_API_KEY` produces a clear configuration error.
- Invalid locations, API limits, HTTP failures, malformed responses, and network failures produce readable messages in one error region beneath the form.
- An aborted superseded request does not produce an error.
- Existing successful weather remains visible when a later search or refresh fails.
- A rain probability of `null` is displayed as `—`, not `0%`.
- Loading and error regions use accessible live announcements.

## Accessibility and Responsive Behaviour

- Every form control has a visible label.
- Keyboard focus is clearly visible.
- Buttons remain legible in default, hover, focus, and disabled states.
- Semantic headings, lists, output/status regions, and weather definitions expose structure to assistive technology.
- The summary grid collapses cleanly on narrow screens.
- The timeline scrolls horizontally rather than shrinking hourly data into unreadable cells.
- Motion respects `prefers-reduced-motion`.

## Testing and Verification

Leave one focused test for the non-trivial hourly selection function. It verifies ordering and the inclusive 24-hour bounds around the reference epoch.

Before completion, run:

1. Type checking
2. The hourly-range test
3. Production build
4. Browser smoke test for initial state, successful search, failed search, timeline rendering, and refresh

## Explicitly Deferred

- Browser geolocation
- API-key secrecy through a backend or serverless proxy
- Request caching and retry libraries
- Router and global state manager
- GSAP or Framer Motion
- Saved locations, unit switching, forecasts beyond the required window, charts, and offline support

Add these only when a concrete requirement makes the extra code necessary.
