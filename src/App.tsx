import { type FormEvent, useRef, useState } from 'react'
import { selectHourlyWindow, type Hour, type WeatherResponse } from './weather'
import './styles.css'

type Weather = WeatherResponse & { hours: Hour[] }

const time = (epoch: number, timezone: string) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: timezone,
}).format(epoch * 1000)

const dateRange = (epoch: number, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone,
  }).formatToParts(epoch * 1000)
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const today = new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day)))
  const date = (offset: number) => {
    const result = new Date(today)
    result.setUTCDate(result.getUTCDate() + offset)
    return result.toISOString().slice(0, 10)
  }
  return [date(-1), date(1)] as const
}

const messageFor = (response: Response) => response.status === 400
  ? 'Location not found.'
  : `Weather service failed (${response.status}).`

export default function App() {
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [lastLocation, setLastLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)

  async function load(query: string) {
    const key = import.meta.env.VITE_VISUAL_CROSSING_API_KEY
    if (!key) {
      setError('Missing VITE_VISUAL_CROSSING_API_KEY in .env.')
      return
    }

    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')

    try {
      const encoded = encodeURIComponent(query.trim())
      const options = `unitGroup=metric&include=current,hours&key=${encodeURIComponent(key)}&contentType=json`
      const base = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encoded}`
      const probe = await fetch(`${base}?${options}`, { signal: controller.signal })
      if (!probe.ok) throw new Error(messageFor(probe))
      const current = await probe.json() as WeatherResponse
      if (!current.currentConditions || !current.timezone) throw new Error('Weather service returned invalid data.')

      const now = current.currentConditions.datetimeEpoch
      const [start, end] = dateRange(now, current.timezone)
      const response = await fetch(`${base}/${start}/${end}?${options}`, { signal: controller.signal })
      if (!response.ok) throw new Error(messageFor(response))
      const data = await response.json() as WeatherResponse
      if (!data.currentConditions || !Array.isArray(data.days)) throw new Error('Weather service returned invalid data.')

      const hours = selectHourlyWindow(data.days.flatMap(({ hours }) => hours), data.currentConditions.datetimeEpoch)
      setWeather({ ...data, hours })
      setLastLocation(query.trim())
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'Could not load weather.')
      }
    } finally {
      if (request.current === controller) setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void load(location)
  }

  const currentHour = weather?.hours.findIndex(({ datetimeEpoch }) =>
    datetimeEpoch >= weather.currentConditions.datetimeEpoch) ?? -1

  return (
    <main>
      <header>
        <p className="eyebrow">LIVE ATMOSPHERIC TELEMETRY</p>
        <h1>WEATHER<br />OUTLOOK</h1>
      </header>

      <form className="search" onSubmit={submit}>
        <label htmlFor="location">LOCATION</label>
        <input
          id="location"
          name="location"
          required
          placeholder="JAKARTA"
          autoComplete="address-level2"
          value={location}
          onChange={({ target }) => setLocation(target.value)}
        />
        <button type="submit" disabled={loading}>SEARCH</button>
      </form>

      <div className={`status${error ? ' error' : ''}`} role={error ? 'alert' : 'status'} aria-live="polite">
        {error || (loading ? 'RETRIEVING LOCATION DATA...' : weather ? 'LATEST REQUEST COMPLETE.' : 'ENTER A CITY OR LOCATION TO BEGIN.')}
      </div>

      {weather && (
        <section className="dashboard" aria-labelledby="weather-location">
          <div className="location-bar">
            <div>
              <p className="condition">{weather.currentConditions.conditions}</p>
              <h2 id="weather-location">{weather.resolvedAddress}</h2>
            </div>
            <button className="refresh" type="button" disabled={loading} onClick={() => void load(lastLocation)}>
              REFRESH
            </button>
          </div>

          <dl className="summary">
            <div className="metric"><dt>TEMPERATURE</dt><dd>{Math.round(weather.currentConditions.temp)}°C</dd></div>
            <div className="metric"><dt>WIND</dt><dd>{Math.round(weather.currentConditions.windspeed)} <small>KM/H</small></dd></div>
            <div className="metric"><dt>RAIN</dt><dd>{weather.currentConditions.precipprob == null ? '—' : `${Math.round(weather.currentConditions.precipprob)}%`}</dd></div>
            <div className="metric"><dt>UPDATED</dt><dd className="update-time">{time(weather.currentConditions.datetimeEpoch, weather.timezone)}</dd></div>
          </dl>

          <div className="timeline-head">
            <h3>48-HOUR TIMELINE</h3>
            <span>PREVIOUS 24H / NEXT 24H</span>
          </div>
          <ol className="timeline" aria-label="Hourly weather, previous and next 24 hours">
            {weather.hours.map((hour, index) => (
              <li className="hour" key={hour.datetimeEpoch} aria-current={index === currentHour ? 'time' : undefined}>
                <time dateTime={new Date(hour.datetimeEpoch * 1000).toISOString()}>{time(hour.datetimeEpoch, weather.timezone)}</time>
                <strong>{Math.round(hour.temp)}°</strong>
                <span>{hour.conditions}</span>
                <dl>
                  <div><dt>WIND</dt><dd>{Math.round(hour.windspeed)} KM/H</dd></div>
                  <div><dt>RAIN</dt><dd>{hour.precipprob == null ? '—' : `${Math.round(hour.precipprob)}%`}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  )
}
