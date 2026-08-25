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
