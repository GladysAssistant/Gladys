const dayjs = require('dayjs');

const { AVAILABLE_LANGUAGES_LIST } = require('../../../utils/constants');

// dayjs parses whatever shape a provider sends (ISO string, Date, timestamp),
// but it never renders here: the timezone plugin of the version this service
// bundles resolves the repeated hour of a fall-back night to the wrong local
// hour when the process runs in the target zone — the standard Docker setup,
// where TZ and the Gladys timezone are the same. Intl is correct by
// specification and independent of the process timezone, so every zoned label
// below is built from its parts.
const DEFAULT_LANGUAGE = 'en';

// One formatter per timezone, and per (locale, timezone) for the weekday:
// building an Intl.DateTimeFormat is the expensive part, and a single weather
// payload formats up to twenty-five instants in the same zone.
const partsFormatters = new Map();
const weekdayFormatters = new Map();

// The pivot format allows up to 24 hourly and 8 daily entries (B.18). Hours are
// capped shorter: a chat answer needs the coming hours, not tomorrow morning
// hour by hour, and the tool result is truncated at 4000 characters upstream.
const MAX_HOURS = 12;
const MAX_DAYS = 8;
const MAX_ALERTS = 5;
const MAX_ALERT_DESCRIPTION_CHARS = 300;

// Fields copied as-is when the provider reports them, per pivot section (B.18).
// Anything absent is dropped instead of being sent as null: an empty field
// costs context and reads to the model as "measured, unknown".
const CURRENT_NUMBER_FIELDS = [
  'temperature',
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
const HOUR_NUMBER_FIELDS = [
  'temperature',
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
const DAY_NUMBER_FIELDS = [
  'temperature_min',
  'temperature_max',
  'humidity',
  'wind_speed',
  'wind_direction',
  'wind_gust',
  'precipitation',
  'precipitation_probability',
  'uv_index',
];

/**
 * @description Round a weather value to one decimal, dropping non-finite values.
 * @param {any} value - Raw provider value.
 * @returns {number|undefined} Rounded number, or undefined when not a number.
 * @example
 * roundWeatherValue(21.34);
 */
function roundWeatherValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.round(value * 10) / 10;
}

/**
 * @description Copy the numeric fields reported by the provider into a target object.
 * @param {object} source - Weather entry from the pivot payload.
 * @param {Array<string>} fields - Field names to copy.
 * @param {object} target - Object receiving the values.
 * @returns {object} The target object.
 * @example
 * copyNumberFields({ temperature: 21 }, ['temperature'], {});
 */
function copyNumberFields(source, fields, target) {
  fields.forEach((field) => {
    const value = roundWeatherValue(source[field]);
    if (value !== undefined) {
      target[field] = value;
    }
  });
  return target;
}

/**
 * @description Parse a pivot datetime into an instant.
 * @param {any} value - Date, timestamp or date string sent by the provider.
 * @returns {number|undefined} Milliseconds since the epoch, or undefined when unparseable.
 * @example
 * toTimestamp('2026-08-12T12:00:00Z');
 */
function toTimestamp(value) {
  if (value === null || value === undefined) {
    return undefined;
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return undefined;
  }
  return date.valueOf();
}

/**
 * @description Calendar parts of an instant, read in a timezone.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {object} Parts of the local clock reading, as zero-padded strings.
 * @example
 * zonedParts(Date.parse('2026-08-12T12:00:00Z'), 'Europe/Paris');
 */
function zonedParts(timestamp, timezoneName) {
  let formatter = partsFormatters.get(timezoneName);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    partsFormatters.set(timezoneName, formatter);
  }
  return Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
}

/**
 * @description Calendar date of an instant in the home timezone.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {string} Date as YYYY-MM-DD.
 * @example
 * formatZonedDate(Date.parse('2026-08-12T12:00:00Z'), 'Europe/Paris');
 */
function formatZonedDate(timestamp, timezoneName) {
  const parts = zonedParts(timestamp, timezoneName);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * @description Clock reading of an instant in the home timezone.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {string} Time as HH:mm.
 * @example
 * formatZonedTime(Date.parse('2026-08-12T12:00:00Z'), 'Europe/Paris');
 */
function formatZonedTime(timestamp, timezoneName) {
  const parts = zonedParts(timestamp, timezoneName);
  return `${parts.hour}:${parts.minute}`;
}

/**
 * @description Date and clock reading of an instant in the home timezone.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {string} Datetime as YYYY-MM-DD HH:mm.
 * @example
 * formatZonedDateTime(Date.parse('2026-08-12T12:00:00Z'), 'Europe/Paris');
 */
function formatZonedDateTime(timestamp, timezoneName) {
  return `${formatZonedDate(timestamp, timezoneName)} ${formatZonedTime(timestamp, timezoneName)}`;
}

/**
 * @description UTC offset of an instant in a timezone, formatted as +HH:mm.
 * Computed from the parts above rather than read from a timeZoneName part: that
 * field is CLDR text whose spelling moves with the ICU version, while the
 * arithmetic is stable and gets the zones sitting on a half or quarter hour
 * right for free.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {string} Offset of that instant, for example '+02:00'.
 * @example
 * utcOffsetLabel(Date.parse('2025-10-26T01:00:00Z'), 'Europe/Paris');
 */
function utcOffsetLabel(timestamp, timezoneName) {
  // floored to the minute: offsets are whole minutes, and the parts carry no
  // seconds, so any seconds in the instant would skew the difference
  const instant = Math.floor(timestamp / 60000) * 60000;
  const parts = zonedParts(instant, timezoneName);
  const localAsUtc = new Date(0);
  localAsUtc.setUTCFullYear(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  localAsUtc.setUTCHours(Number(parts.hour), Number(parts.minute), 0, 0);
  const offsetMinutes = Math.round((localAsUtc.getTime() - instant) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
  const minutes = String(absoluteMinutes % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * @description Name of the weekday of an instant, in the language of the user.
 * Rendered so that "et samedi ?" matches a row of the payload as directly as
 * "and saturday?" does. Any language outside the ones Gladys supports falls back
 * to English rather than to the locale of the host, which would make the payload
 * depend on the machine.
 * @param {number} timestamp - Instant, in milliseconds since the epoch.
 * @param {string} timezoneName - IANA timezone of the home.
 * @param {string} language - Language of the user.
 * @returns {string} Weekday name, for example 'jeudi'.
 * @example
 * weekdayName(Date.parse('2026-08-13T00:00:00Z'), 'Europe/Paris', 'fr');
 */
function weekdayName(timestamp, timezoneName, language) {
  const locale = AVAILABLE_LANGUAGES_LIST.includes(language) ? language : DEFAULT_LANGUAGE;
  const key = `${locale}|${timezoneName}`;
  let formatter = weekdayFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { timeZone: timezoneName, weekday: 'long' });
    weekdayFormatters.set(key, formatter);
  }
  return formatter.format(new Date(timestamp));
}

/**
 * @description Unit labels of a pivot unit system.
 * The pivot stamps `metric` or `imperial` (B.18); the labels are what the model
 * repeats to the user, so they never have to be guessed from the values.
 * @param {string} units - Unit system of the payload.
 * @returns {object} Unit labels.
 * @example
 * unitLabels('metric');
 */
function unitLabels(units) {
  // pressure is hPa in both systems (B.18 unit line), the others differ
  if (units === 'imperial' || units === 'us') {
    return { temperature: '°F', wind_speed: 'mph', precipitation: 'in', visibility: 'mi', pressure: 'hPa' };
  }
  return { temperature: '°C', wind_speed: 'm/s', precipitation: 'mm', visibility: 'km', pressure: 'hPa' };
}

/**
 * @description Format an alert of the pivot payload for the chat context.
 * @param {object} alert - Normalized pivot alert.
 * @param {string} timezoneName - IANA timezone of the home.
 * @returns {object} Compact alert.
 * @example
 * formatAlert({ severity: 'severe', event: 'Orages' }, 'Europe/Paris');
 */
function formatAlert(alert, timezoneName) {
  const formatted = { severity: alert.severity, event: alert.event };
  if (alert.type) {
    formatted.type = alert.type;
  }
  const start = toTimestamp(alert.start);
  if (start !== undefined) {
    formatted.start = formatZonedDateTime(start, timezoneName);
  }
  const end = toTimestamp(alert.end);
  if (end !== undefined) {
    formatted.end = formatZonedDateTime(end, timezoneName);
  }
  if (typeof alert.description === 'string' && alert.description.length > 0) {
    formatted.description =
      alert.description.length > MAX_ALERT_DESCRIPTION_CHARS
        ? `${alert.description.slice(0, MAX_ALERT_DESCRIPTION_CHARS)}...`
        : alert.description;
  }
  return formatted;
}

/**
 * @description Format the pivot weather payload (B.18) for the AI chat context.
 * Optional fields are kept only when the provider reported them, dates are
 * rendered in the home timezone, and each list is capped so a single weather
 * answer never floods the model context.
 * @param {object} weather - Pivot weather payload resolved by gladys.weather.get.
 * @param {object} options - Formatting options.
 * @param {string} options.house - House name the weather was fetched for.
 * @param {string} options.timezone - IANA timezone of the home.
 * @param {string} [options.language] - Language of the user, used for the weekday names.
 * @returns {object} Compact weather object for the model.
 * @example
 * formatWeather(weather, { house: 'Home', timezone: 'Europe/Paris', language: 'fr' });
 */
function formatWeather(weather, { house, timezone: timezoneName, language = DEFAULT_LANGUAGE }) {
  const units = weather.units === 'imperial' || weather.units === 'us' ? 'imperial' : 'metric';
  const labels = unitLabels(units);

  const now = {};
  const datetime = toTimestamp(weather.datetime);
  if (datetime !== undefined) {
    now.datetime = formatZonedDateTime(datetime, timezoneName);
  }
  if (weather.weather) {
    now.weather = weather.weather;
  }
  copyNumberFields(weather, CURRENT_NUMBER_FIELDS, now);
  if (typeof weather.is_day === 'boolean') {
    now.is_day = weather.is_day;
  }
  const sunrise = toTimestamp(weather.sunrise);
  if (sunrise !== undefined) {
    now.sunrise = formatZonedTime(sunrise, timezoneName);
  }
  const sunset = toTimestamp(weather.sunset);
  if (sunset !== undefined) {
    now.sunset = formatZonedTime(sunset, timezoneName);
  }

  const formatted = {
    house,
    timezone: timezoneName,
    units,
    temperature_unit: labels.temperature,
    wind_speed_unit: labels.wind_speed,
    precipitation_unit: labels.precipitation,
    visibility_unit: labels.visibility,
    pressure_unit: labels.pressure,
    now,
  };

  const hours = (Array.isArray(weather.hours) ? weather.hours : []).slice(0, MAX_HOURS).map((hour) => {
    const entry = {};
    const hourDatetime = toTimestamp(hour.datetime);
    if (hourDatetime !== undefined) {
      // The offset keeps hourly labels unique on the night a timezone falls
      // back: in Paris, 2025-10-26T00:00Z and 2025-10-26T01:00Z are two
      // different hours of the forecast that both read 02:00 on the local clock.
      entry.datetime = `${formatZonedDateTime(hourDatetime, timezoneName)}${utcOffsetLabel(
        hourDatetime,
        timezoneName,
      )}`;
    }
    if (hour.weather) {
      entry.weather = hour.weather;
    }
    copyNumberFields(hour, HOUR_NUMBER_FIELDS, entry);
    // strict boolean only, like the current conditions: `weather` carries the
    // meteorology and `is_day` the day/night half of it (B.18)
    if (typeof hour.is_day === 'boolean') {
      entry.is_day = hour.is_day;
    }
    return entry;
  });
  if (hours.length > 0) {
    formatted.hours = hours;
  }

  const days = (Array.isArray(weather.days) ? weather.days : []).slice(0, MAX_DAYS).map((day) => {
    const entry = {};
    const dayDatetime = toTimestamp(day.datetime);
    if (dayDatetime !== undefined) {
      entry.date = formatZonedDate(dayDatetime, timezoneName);
      // The weekday name saves the model from deriving it from the date: a
      // "what is the weather on saturday" question is answered by matching a
      // row, never by counting days from today.
      entry.day_of_week = weekdayName(dayDatetime, timezoneName, language);
    }
    if (day.weather) {
      entry.weather = day.weather;
    }
    copyNumberFields(day, DAY_NUMBER_FIELDS, entry);
    const daySunrise = toTimestamp(day.sunrise);
    if (daySunrise !== undefined) {
      entry.sunrise = formatZonedTime(daySunrise, timezoneName);
    }
    const daySunset = toTimestamp(day.sunset);
    if (daySunset !== undefined) {
      entry.sunset = formatZonedTime(daySunset, timezoneName);
    }
    return entry;
  });
  if (days.length > 0) {
    formatted.days = days;
  }

  const alerts = (Array.isArray(weather.alerts) ? weather.alerts : [])
    .slice(0, MAX_ALERTS)
    .map((alert) => formatAlert(alert, timezoneName));
  if (alerts.length > 0) {
    formatted.alerts = alerts;
  }

  return formatted;
}

module.exports = {
  formatWeather,
  MAX_HOURS,
  MAX_DAYS,
  MAX_ALERTS,
  MAX_ALERT_DESCRIPTION_CHARS,
};
