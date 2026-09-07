const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { queueWrapper } = require('../utils/queueWrapper');

dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @description Queue an energy cost calculation from a date.
 * @param {Date|string} startAt - Start date or ISO date string.
 * @param {object} [options] - Options forwarded to calculateCostFrom.
 * @param {Array<string>} [options.deviceIds] - Only recalculate cost for these device ids.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostFromDate('2026-07-19');
 */
async function calculateCostFromDate(startAt, options = {}) {
  return queueWrapper(this.queue, async () => {
    let normalizedStartAt = new Date(startAt);

    if (typeof startAt === 'string' && DATE_ONLY_PATTERN.test(startAt)) {
      const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
      normalizedStartAt = dayjs
        .tz(startAt, systemTimezone)
        .startOf('day')
        .toDate();
    }

    await this.calculateCostFrom(normalizedStartAt, null, options);
  });
}

module.exports = {
  calculateCostFromDate,
};
