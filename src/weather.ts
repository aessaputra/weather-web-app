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

const isHour = (value: unknown): value is Hour => {
  if (!value || typeof value !== 'object') return false
  const hour = value as Record<string, unknown>
  return Number.isFinite(hour.datetimeEpoch)
    && Number.isFinite(hour.temp)
    && Number.isFinite(hour.windspeed)
    && (hour.precipprob === null || Number.isFinite(hour.precipprob))
    && typeof hour.conditions === 'string'
}

export function isWeatherResponse(value: unknown): value is WeatherResponse {
  if (!value || typeof value !== 'object') return false
  const weather = value as Record<string, unknown>
  if (typeof weather.resolvedAddress !== 'string' || !weather.resolvedAddress
    || typeof weather.timezone !== 'string' || !weather.timezone
    || !isHour(weather.currentConditions) || !Array.isArray(weather.days)
    || !weather.days.every((day) => day && typeof day === 'object'
      && Array.isArray((day as Record<string, unknown>).hours)
      && ((day as Record<string, unknown>).hours as unknown[]).every(isHour))) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: weather.timezone }).format()
    return true
  } catch {
    return false
  }
}

const DAY = 24 * 60 * 60

export function selectHourlyWindow(hours: Hour[], nowEpoch: number) {
  return hours
    .filter(({ datetimeEpoch }) => Math.abs(datetimeEpoch - nowEpoch) <= DAY)
    .sort((a, b) => a.datetimeEpoch - b.datetimeEpoch)
}
