const dayjs = require('dayjs');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { MAX_ENERGY_CALENDAR_DAYS, ENERGY_CALENDAR_DATE_REGEX, ENERGY_CALENDAR_DAY_TYPE_REGEX } = require('./constants');

/**
 * @description Normalize and bound the day types map returned by an
 * "energy-calendar" integration (B.21). The payload comes from unaudited
 * code: only well-formed entries enter the core. An entry is kept when its
 * key is a valid `YYYY-MM-DD` calendar date inside the requested range and
 * its value a day type slug (`^[a-z0-9][a-z0-9-]{0,31}$`); anything else is
 * dropped. At most MAX_ENERGY_CALENDAR_DAYS keys are inspected and kept.
 * A payload that is not a plain object, or that yields no valid entry at
 * all, fails like a timeout: an empty map must never pass for a calendar
 * (the cost run would then wipe the cost history and find no day type),
 * the provider loop falls through instead.
 * @param {object} payload - The raw `data.day_types` object of the ack.
 * @param {object} range - The requested range.
 * @param {string} range.start_date - First day requested (YYYY-MM-DD).
 * @param {string} range.end_date - Last day requested (YYYY-MM-DD).
 * @returns {Map<string, string>} Map of `YYYY-MM-DD` -> day type.
 * @example
 * const dayTypes = normalizeEnergyDayTypes(
 *   { '2026-09-05': 'weekend', '2026-09-07': 'weekday' },
 *   { start_date: '2026-09-01', end_date: '2026-09-30' },
 * );
 */
function normalizeEnergyDayTypes(payload, { start_date: startDate, end_date: endDate }) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_ENERGY_DAY_TYPES');
  }
  const dayTypes = new Map();
  let dropped = 0;
  // bound the work itself, not only the result: a huge object of invalid
  // keys must not be walked in full
  const keys = Object.keys(payload);
  if (keys.length > MAX_ENERGY_CALENDAR_DAYS) {
    logger.debug(`Energy calendar: ${keys.length - MAX_ENERGY_CALENDAR_DAYS} entries beyond the cap ignored`);
  }
  keys.slice(0, MAX_ENERGY_CALENDAR_DAYS).forEach((date) => {
    const dayType = payload[date];
    const validDate =
      ENERGY_CALENDAR_DATE_REGEX.test(date) &&
      dayjs(date).format('YYYY-MM-DD') === date &&
      date >= startDate &&
      date <= endDate;
    if (!validDate || typeof dayType !== 'string' || !ENERGY_CALENDAR_DAY_TYPE_REGEX.test(dayType)) {
      dropped += 1;
      return;
    }
    dayTypes.set(date, dayType);
  });
  if (dropped > 0) {
    logger.debug(`Energy calendar: ${dropped} invalid day type entries dropped`);
  }
  if (dayTypes.size === 0) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_EMPTY_ENERGY_DAY_TYPES');
  }
  return dayTypes;
}

module.exports = {
  normalizeEnergyDayTypes,
};
