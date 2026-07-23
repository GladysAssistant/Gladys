const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { buildPublicHolidaysSet } = require('../../../lib/french-calendar');
const { ENERGY_CONTRACT_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description Build a set of French public holiday dates for cost calculation.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @returns {Promise<Set<string>>} Set of public holiday dates.
 * @example
 * await buildPublicHolidaysMap('2025-01-01');
 */
async function buildPublicHolidaysMap(startDate) {
  const today = dayjs()
    .tz('Europe/Paris')
    .format('YYYY-MM-DD');
  const fromDate = dayjs(startDate)
    .tz('Europe/Paris')
    .format('YYYY-MM-DD');

  logger.info(`Building French public holidays set from ${fromDate} to ${today}`);
  const publicHolidaysSet = await buildPublicHolidaysSet(fromDate, today);
  logger.info(`Found ${publicHolidaysSet.size} French public holidays in range`);

  return publicHolidaysSet;
}

/**
 * @description Check if any energy prices require French public holiday data.
 * @param {Array} energyPrices - Energy price rows.
 * @returns {boolean} True if public holidays are needed.
 * @example
 * needsPublicHolidays([{ contract: 'enercoop-nuit-weekend' }]);
 */
function needsPublicHolidays(energyPrices) {
  return energyPrices.some(
    (p) =>
      p.contract === ENERGY_CONTRACT_TYPES.ENERCOOP_NUIT_WEEKEND ||
      p.contract === ENERGY_CONTRACT_TYPES.ENERCOOP_2_SAISONS,
  );
}

module.exports = {
  buildPublicHolidaysMap,
  needsPublicHolidays,
};
