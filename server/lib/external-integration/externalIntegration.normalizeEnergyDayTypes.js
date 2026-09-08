const dayjs = require('dayjs');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { MAX_ENERGY_CALENDAR_DAYS, ENERGY_CALENDAR_DATE_REGEX, ENERGY_CALENDAR_DAY_TYPE_REGEX } = require('./constants');

/**
 * @description Normalize and bound the day types map returned by an
 * "energy-calendar" integration (B.19). The payload comes from unaudited
 * code: only well-formed entries enter the core. An entry is kept when its
 * key is a valid `YYYY-MM-DD` calendar date inside the requested range and
 * its value a day type slug (`^[a-z0-9][a-z0-9-]{0,31}$`); anything else is
 * dropped, and the map is capped to MAX_ENERGY_CALENDAR_DAYS entries.
 * A payload that is not a plain object fails like a timeout.
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
  Object.keys(payload).some((date) => {
    const dayType = payload[date];
    const validDate =
      ENERGY_CALENDAR_DATE_REGEX.test(date) &&
      dayjs(date).format('YYYY-MM-DD') === date &&
      date >= startDate &&
      date <= endDate;
    if (!validDate || typeof dayType !== 'string' || !ENERGY_CALENDAR_DAY_TYPE_REGEX.test(dayType)) {
      dropped += 1;
      return false;
    }
    dayTypes.set(date, dayType);
    // stop iterating once the cap is reached
    return dayTypes.size >= MAX_ENERGY_CALENDAR_DAYS;
  });
  if (dropped > 0) {
    logger.debug(`Energy calendar: ${dropped} invalid day type entries dropped`);
  }
  return dayTypes;
}

module.exports = {
  normalizeEnergyDayTypes,
};
