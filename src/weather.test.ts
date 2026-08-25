/// <reference types="node" />

import assert from 'node:assert/strict'
import test from 'node:test'
import { isWeatherResponse, selectHourlyWindow, type Hour } from './weather.ts'

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

test('validates every weather field consumed by the dashboard', () => {
  const valid = {
    resolvedAddress: 'Jakarta',
    timezone: 'Asia/Jakarta',
    currentConditions: hour(100_000),
    days: [{ hours: [hour(100_000)] }],
  }

  assert.equal(isWeatherResponse(valid), true)
  assert.equal(isWeatherResponse({ ...valid, currentConditions: { ...valid.currentConditions, datetimeEpoch: 'now' } }), false)
  assert.equal(isWeatherResponse({ ...valid, days: [{}] }), false)
  assert.equal(isWeatherResponse({ ...valid, days: [{ hours: [{ ...hour(100_000), temp: null }] }] }), false)
  assert.equal(isWeatherResponse({ ...valid, timezone: '' }), false)
})
