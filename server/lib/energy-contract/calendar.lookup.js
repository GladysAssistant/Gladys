const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { CALENDAR_GRANULARITIES } = require('./tariff.constants');
const { parseTimeToMinutes, getLocalContext, addDays } = require('./tariff.time');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description Milliseconds since the epoch of a date-like value.
 * @param {Date|string|number} value - Date, ISO string or timestamp.
 * @returns {number} Milliseconds since the epoch.
 * @example
 * toMs('2026-01-12T05:00:00Z');
 */
function toMs(value) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * @description Build the in-memory lookup the pricing engine reads calendar values from.
 * Daily calendars are keyed by local date (in the calendar timezone, shifted by
 * `day_starts_at`: the Tempo colour runs from 06:00 to 06:00), 30-minute calendars
 * by the exact start instant.
 * @param {object} definitions - { [key]: { granularity, timezone?, day_starts_at? } }.
 * @param {Array<object>} entries - [{ calendar_key, starts_at?, date?, value }] (`date` = local day of a daily entry).
 * @param {string} defaultTimezone - Timezone of daily calendars that declare none (the contract's).
 * @returns {object} The lookup: get(key, ms, local, localTimezone), has(key), keys().
 * @example
 * const lookup = createCalendarLookup(
 *   { tempo: { granularity: 'day', timezone: 'Europe/Paris', day_starts_at: '06:00' } },
 *   [{ calendar_key: 'tempo', date: '2026-01-12', value: 'red' }],
 *   'Europe/Paris',
 * );
 * lookup.get('tempo', Date.UTC(2026, 0, 13, 2)); // 'red' (03:00 Paris, before 06:00: previous day)
 */
function createCalendarLookup(definitions = {}, entries = [], defaultTimezone = 'UTC') {
  const calendars = new Map();
  Object.keys(definitions).forEach((key) => {
    const definition = definitions[key];
    calendars.set(key, {
      granularity: definition.granularity || CALENDAR_GRANULARITIES.DAY,
      timezone: definition.timezone || defaultTimezone,
      dayStartsAtMinutes: definition.day_starts_at ? parseTimeToMinutes(definition.day_starts_at) : 0,
      values: new Map(),
    });
  });
  entries.forEach((entry) => {
    const calendar = calendars.get(entry.calendar_key);
    if (!calendar) {
      return;
    }
    if (calendar.granularity === CALENDAR_GRANULARITIES.DAY) {
      const date = entry.date || getLocalContext(toMs(entry.starts_at), calendar.timezone).date;
      calendar.values.set(date, entry.value);
    } else {
      calendar.values.set(toMs(entry.starts_at), entry.value);
    }
  });

  /**
   * @description Read the value of a calendar for an interval start.
   * @param {string} key - Calendar key.
   * @param {number} ms - Interval start, milliseconds since the epoch.
   * @param {object} [local] - Local context already computed in `localTimezone` (reused when it matches).
   * @param {string} [localTimezone] - Timezone of `local`.
   * @returns {string|number|undefined} The value, undefined when the calendar has none.
   * @example
   * lookup.get('tempo', Date.UTC(2026, 0, 12, 12));
   */
  function get(key, ms, local, localTimezone) {
    const calendar = calendars.get(key);
    if (!calendar) {
      return undefined;
    }
    if (calendar.granularity !== CALENDAR_GRANULARITIES.DAY) {
      return calendar.values.get(ms);
    }
    const context = local && localTimezone === calendar.timezone ? local : getLocalContext(ms, calendar.timezone);
    const date = context.minutes < calendar.dayStartsAtMinutes ? addDays(context.date, -1) : context.date;
    return calendar.values.get(date);
  }

  return {
    get,
    has: (key) => calendars.has(key),
    keys: () => Array.from(calendars.keys()),
  };
}

module.exports = {
  createCalendarLookup,
};
