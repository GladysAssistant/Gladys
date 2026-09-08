const Promise = require('bluebird');
const dayjs = require('dayjs');

const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, BadParameters } = require('../../utils/coreErrors');
const { MAX_ENERGY_CALENDAR_DAYS, ENERGY_CALENDAR_DATE_REGEX } = require('../external-integration/constants');

/**
 * @description Validate a YYYY-MM-DD day string.
 * @param {string} name - The parameter name (for the error message).
 * @param {string} value - The value to validate.
 * @returns {string} The validated value.
 * @example
 * validateDay('start_date', '2026-09-01');
 */
function validateDay(name, value) {
  if (
    typeof value !== 'string' ||
    !ENERGY_CALENDAR_DATE_REGEX.test(value) ||
    dayjs(value).format('YYYY-MM-DD') !== value
  ) {
    throw new BadParameters(`${name}: must be a YYYY-MM-DD date`);
  }
  return value;
}

/**
 * @description Get the day types (weekday, weekend, holiday...) of a range of
 * days from the first working energy calendar provider. The core does not
 * know any provider by name: every service in the stateManager exposing
 * `energyCalendar.getDayTypes(range)` — the proxy service of an external
 * "energy-calendar" integration (B.21) — is a candidate. Candidates are
 * sorted by service name and tried in order, first success wins; a failing
 * candidate (stopped integration, third-party API down, invalid payload)
 * falls through to the next one.
 * @param {object} requestedRange - The requested range of days, inclusive.
 * @param {string} requestedRange.start_date - First day (YYYY-MM-DD).
 * @param {string} requestedRange.end_date - Last day (YYYY-MM-DD).
 * @returns {Promise<Map<string, string>>} Map of `YYYY-MM-DD` -> day type.
 * @example
 * const dayTypes = await gladys.energyCalendar.getDayTypes({
 *   start_date: '2026-09-01',
 *   end_date: '2026-09-30',
 * });
 * dayTypes.get('2026-09-05'); // 'weekend'
 */
async function getDayTypes(requestedRange) {
  const { start_date: startDate, end_date: endDate } = requestedRange || {};
  validateDay('start_date', startDate);
  validateDay('end_date', endDate);
  if (startDate > endDate) {
    throw new BadParameters('start_date: must not be after end_date');
  }
  // the requested range is bounded: a provider is never asked for more
  // days than the core keeps (MAX_ENERGY_CALENDAR_DAYS)
  let boundedStartDate = startDate;
  const earliestStartDate = dayjs(endDate)
    .subtract(MAX_ENERGY_CALENDAR_DAYS - 1, 'day')
    .format('YYYY-MM-DD');
  if (boundedStartDate < earliestStartDate) {
    logger.warn(`Energy calendar: range clamped from ${startDate} to ${earliestStartDate}`);
    boundedStartDate = earliestStartDate;
  }
  const range = { start_date: boundedStartDate, end_date: endDate };
  const candidates = this.service.stateManager
    .getAllKeys('service')
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.energyCalendar && typeof service.energyCalendar.getDayTypes === 'function';
    })
    .sort();
  if (candidates.length === 0) {
    throw new ServiceNotConfiguredError('No energy calendar provider is installed or configured.');
  }
  let firstError = null;
  const dayTypes = await Promise.reduce(
    candidates,
    async (result, serviceName) => {
      if (result !== null) {
        return result;
      }
      const service = this.service.getService(serviceName);
      try {
        return await service.energyCalendar.getDayTypes(range);
      } catch (e) {
        logger.debug(`Energy calendar provider ${serviceName} failed`);
        logger.debug(e);
        if (firstError === null) {
          firstError = e;
        }
        return null;
      }
    },
    null,
  );
  if (dayTypes === null) {
    throw firstError;
  }
  return dayTypes;
}

module.exports = {
  getDayTypes,
};
