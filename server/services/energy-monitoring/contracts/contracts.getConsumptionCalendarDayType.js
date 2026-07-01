const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

const { ENERGY_PRICE_DAY_TYPES } = require('../../../utils/constants');
const { isFrenchPublicHoliday } = require('./contracts.isFrenchPublicHoliday');

/**
 * @description Resolve the calendar day type for energy pricing (weekday, weekend, or holiday).
 * @param {Date} consumptionDate - The date of the consumption sample.
 * @param {string} systemTimezone - The timezone of the system.
 * @returns {string} One of ENERGY_PRICE_DAY_TYPES.WEEKDAY, WEEKEND, or HOLIDAY.
 */
function getConsumptionCalendarDayType(consumptionDate, systemTimezone) {
  const date = dayjs(consumptionDate).tz(systemTimezone);
  const dateString = date.format('YYYY-MM-DD');

  if (isFrenchPublicHoliday(dateString)) {
    return ENERGY_PRICE_DAY_TYPES.HOLIDAY;
  }

  const dayOfWeek = date.day();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return ENERGY_PRICE_DAY_TYPES.WEEKEND;
  }

  return ENERGY_PRICE_DAY_TYPES.WEEKDAY;
}

module.exports = {
  getConsumptionCalendarDayType,
};
