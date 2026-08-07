const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const {
  MAX_WEATHER_HOURS,
  MAX_WEATHER_DAYS,
  MAX_WEATHER_ALERTS,
  MAX_WEATHER_ALERT_EVENT_LENGTH,
  MAX_WEATHER_ALERT_DESCRIPTION_LENGTH,
  WEATHER_CONDITIONS,
  WEATHER_ALERT_SEVERITIES,
  WEATHER_ALERT_TYPES,
  MAX_WEATHER_IMAGES,
  WEATHER_IMAGE_KEY_REGEX,
  MAX_WEATHER_IMAGE_LABEL_LENGTH,
} = require('./constants');

/**
 * @description Coerce a value to a finite number.
 * @param {any} value - The value to coerce.
 * @returns {number|null} The number, or null when not a finite number.
 * @example
 * toFiniteNumber('12.5');
 */
function toFiniteNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * @description Coerce a value to a valid Date.
 * @param {any} value - An ISO string, a timestamp or a Date.
 * @returns {Date|null} The date, or null when invalid.
 * @example
 * toValidDate('2026-08-01T12:00:00.000Z');
 */
function toValidDate(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * @description Coerce a value to a pivot weather condition.
 * @param {any} value - The condition sent by the integration.
 * @returns {string} A condition of the pivot enum, 'unknown' otherwise.
 * @example
 * toCondition('rain');
 */
function toCondition(value) {
  return WEATHER_CONDITIONS.includes(value) ? value : 'unknown';
}

// the pivot fields expressed as a percentage (0-100)
const PERCENT_FIELDS = ['humidity', 'cloud_cover', 'precipitation_probability'];

/**
 * @description Copy the optional finite-number fields of an entry.
 * @param {object} source - The raw entry sent by the integration.
 * @param {object} target - The normalized entry.
 * @param {Array<string>} fields - The optional numeric field names.
 * @example
 * copyOptionalNumbers(payload, current, ['humidity', 'pressure']);
 */
function copyOptionalNumbers(source, target, fields) {
  fields.forEach((field) => {
    const value = toFiniteNumber(source[field]);
    if (value === null) {
      return;
    }
    // percent fields are clamped to [0, 100]: the widget appends '%' as-is,
    // an out-of-range value must never reach it
    target[field] = PERCENT_FIELDS.includes(field) ? Math.min(100, Math.max(0, value)) : value;
  });
}

/**
 * @description Copy the optional is_day flag of an entry. Strict boolean
 * only: truthy strings or numbers are dropped, never coerced — an absent
 * flag renders as day, a wrong guess would flip the whole icon set.
 * @param {object} source - The raw entry sent by the integration.
 * @param {object} target - The normalized entry.
 * @example
 * copyIsDay(payload, current);
 */
function copyIsDay(source, target) {
  if (typeof source.is_day === 'boolean') {
    target.is_day = source.is_day;
  }
}

/**
 * @description Copy the optional date fields of an entry.
 * @param {object} source - The raw entry sent by the integration.
 * @param {object} target - The normalized entry.
 * @param {Array<string>} fields - The optional date field names.
 * @example
 * copyOptionalDates(payload, current, ['sunrise', 'sunset']);
 */
function copyOptionalDates(source, target, fields) {
  fields.forEach((field) => {
    const date = toValidDate(source[field]);
    if (date !== null) {
      target[field] = date;
    }
  });
}

// The optional field whitelists of the pivot weather format (B.18), from
// the generalization analysis of the market providers (OpenWeather One
// Call, Météo France, Open-Meteo) and of the Home Assistant weather
// entity model (the broadest abstraction in the field, ~40 providers).
const CURRENT_OPTIONAL_NUMBERS = [
  'apparent_temperature',
  'humidity',
  'pressure',
  'dew_point',
  'wind_speed',
  'wind_direction',
  'wind_gust',
  'visibility',
  'cloud_cover',
  'uv_index',
];
const HOUR_OPTIONAL_NUMBERS = [
  'apparent_temperature',
  'humidity',
  'pressure',
  'wind_speed',
  'wind_direction',
  'wind_gust',
  'cloud_cover',
  'precipitation',
  'precipitation_probability',
  'uv_index',
];
const DAY_OPTIONAL_NUMBERS = [
  'humidity',
  'wind_speed',
  'wind_direction',
  'wind_gust',
  'precipitation',
  'precipitation_probability',
  'uv_index',
];

/**
 * @description Normalize and bound the weather payload returned by a
 * "weather" external integration (B.18). The payload comes from unaudited
 * code: every field is whitelisted (anything unknown is dropped), numbers
 * must be finite, strings are bounded, arrays are capped and dates are
 * parsed and validated. The pivot's `units` value is stamped from the
 * requested unit system, never echoed from the integration. A payload
 * without the required fields fails like a timeout, so the generic
 * provider loop of lib/weather falls through to the next provider.
 * @param {object} payload - The `data.weather` of the command-result.
 * @param {string} [units] - The requested unit system ('metric' or 'us').
 * @returns {object} The normalized pivot weather object.
 * @example
 * const weather = normalizeWeather({ temperature: 12, weather: 'rain', datetime: '2026-08-01T12:00:00Z' }, 'metric');
 */
function normalizeWeather(payload, units) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER');
  }
  const temperature = toFiniteNumber(payload.temperature);
  const datetime = toValidDate(payload.datetime);
  if (temperature === null || datetime === null) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER');
  }
  // the two historical pivot values, understood by the widget and the chat
  const pivotUnits = units === 'us' ? 'imperial' : 'metric';
  const weather = {
    temperature,
    datetime,
    weather: toCondition(payload.weather),
    units: pivotUnits,
  };
  copyOptionalNumbers(payload, weather, CURRENT_OPTIONAL_NUMBERS);
  copyOptionalDates(payload, weather, ['sunrise', 'sunset']);
  copyIsDay(payload, weather);
  if (Array.isArray(payload.hours)) {
    weather.hours = [];
    payload.hours.slice(0, MAX_WEATHER_HOURS).forEach((rawHour) => {
      if (rawHour === null || typeof rawHour !== 'object') {
        return;
      }
      const hourTemperature = toFiniteNumber(rawHour.temperature);
      const hourDatetime = toValidDate(rawHour.datetime);
      if (hourTemperature === null || hourDatetime === null) {
        return;
      }
      const hour = {
        temperature: hourTemperature,
        datetime: hourDatetime,
        weather: toCondition(rawHour.weather),
        units: pivotUnits,
      };
      copyOptionalNumbers(rawHour, hour, HOUR_OPTIONAL_NUMBERS);
      copyIsDay(rawHour, hour);
      weather.hours.push(hour);
    });
  }
  if (Array.isArray(payload.days)) {
    weather.days = [];
    payload.days.slice(0, MAX_WEATHER_DAYS).forEach((rawDay) => {
      if (rawDay === null || typeof rawDay !== 'object') {
        return;
      }
      const temperatureMin = toFiniteNumber(rawDay.temperature_min);
      const temperatureMax = toFiniteNumber(rawDay.temperature_max);
      const dayDatetime = toValidDate(rawDay.datetime);
      if (temperatureMin === null || temperatureMax === null || dayDatetime === null) {
        return;
      }
      const day = {
        temperature_min: temperatureMin,
        temperature_max: temperatureMax,
        datetime: dayDatetime,
      };
      if (rawDay.weather !== undefined) {
        day.weather = toCondition(rawDay.weather);
      }
      copyOptionalNumbers(rawDay, day, DAY_OPTIONAL_NUMBERS);
      copyOptionalDates(rawDay, day, ['sunrise', 'sunset']);
      weather.days.push(day);
    });
  }
  if (Array.isArray(payload.images)) {
    // provider images (B.18 point 6): metadata only — the bytes travel on
    // demand over weather.get-image and are validated separately
    weather.images = [];
    const seenImageKeys = new Set();
    payload.images.slice(0, MAX_WEATHER_IMAGES).forEach((rawImage) => {
      if (rawImage === null || typeof rawImage !== 'object') {
        return;
      }
      if (typeof rawImage.key !== 'string' || !WEATHER_IMAGE_KEY_REGEX.test(rawImage.key)) {
        return;
      }
      if (seenImageKeys.has(rawImage.key)) {
        return;
      }
      seenImageKeys.add(rawImage.key);
      const image = { key: rawImage.key };
      if (rawImage.label !== null && typeof rawImage.label === 'object' && !Array.isArray(rawImage.label)) {
        const label = {};
        Object.keys(rawImage.label).forEach((language) => {
          const value = rawImage.label[language];
          if (language.length <= 5 && typeof value === 'string' && value.trim().length > 0) {
            label[language] = value.trim().substring(0, MAX_WEATHER_IMAGE_LABEL_LENGTH);
          }
        });
        if (Object.keys(label).length > 0) {
          image.label = label;
        }
      }
      weather.images.push(image);
    });
  }
  if (Array.isArray(payload.alerts)) {
    weather.alerts = [];
    payload.alerts.slice(0, MAX_WEATHER_ALERTS).forEach((rawAlert) => {
      if (rawAlert === null || typeof rawAlert !== 'object') {
        return;
      }
      if (!WEATHER_ALERT_SEVERITIES.includes(rawAlert.severity) || typeof rawAlert.event !== 'string') {
        return;
      }
      const event = rawAlert.event.trim().substring(0, MAX_WEATHER_ALERT_EVENT_LENGTH);
      if (event.length === 0) {
        return;
      }
      const alert = {
        severity: rawAlert.severity,
        event,
      };
      // optional phenomenon type: invalid values are dropped, the alert
      // is kept and rendered from its event text alone
      if (WEATHER_ALERT_TYPES.includes(rawAlert.type)) {
        alert.type = rawAlert.type;
      }
      if (typeof rawAlert.description === 'string' && rawAlert.description.trim().length > 0) {
        alert.description = rawAlert.description.trim().substring(0, MAX_WEATHER_ALERT_DESCRIPTION_LENGTH);
      }
      copyOptionalDates(rawAlert, alert, ['start', 'end']);
      weather.alerts.push(alert);
    });
  }
  return weather;
}

module.exports = {
  normalizeWeather,
};
