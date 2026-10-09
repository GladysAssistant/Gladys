const ENERGY_PERIODS = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
};

const DEFAULT_ENERGY_PERIOD_START_DAY = 1;
const MIN_ENERGY_PERIOD_START_DAY = 1;
const MAX_ENERGY_PERIOD_START_DAY = 31;

/**
 * @description Return the number of days of a month.
 * The month index follows the JavaScript convention (0 = January), and values
 * outside of [0, 11] roll over to the previous/next year.
 * @param {number} year - Full year.
 * @param {number} monthIndex - Month index (0 = January).
 * @returns {number} Number of days in this month.
 * @example
 * getDaysInMonth(2024, 1); // 29
 */
function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * @description Return the day of the month a billing period starts on for a given month.
 * Months are 28 to 31 days long: when the configured start day does not exist in
 * this month (ex: the 31st in February), the period starts on the last day of the month.
 * @param {number} year - Full year.
 * @param {number} monthIndex - Month index (0 = January).
 * @param {number} startDay - Configured start day of the billing period (1-31).
 * @returns {number} Day of the month the period starts on.
 * @example
 * getPeriodStartDayInMonth(2023, 1, 31); // 28 (February 2023)
 */
function getPeriodStartDayInMonth(year, monthIndex, startDay) {
  return Math.min(startDay, getDaysInMonth(year, monthIndex));
}

/**
 * @description Validate a billing period start day coming from a user input or an HTTP query.
 * @param {*} value - Value to validate. `undefined`, `null` and `''` fall back to the default (1).
 * @returns {number | null} The start day as an integer, or null if the value is invalid.
 * @example
 * parseEnergyPeriodStartDay('5'); // 5
 */
function parseEnergyPeriodStartDay(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_ENERGY_PERIOD_START_DAY;
  }
  const parsedValue = Number(value);
  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < MIN_ENERGY_PERIOD_START_DAY ||
    parsedValue > MAX_ENERGY_PERIOD_START_DAY
  ) {
    return null;
  }
  return parsedValue;
}

/**
 * @description Return the start of the period beginning in the calendar month (or year) of a date.
 * Useful when the user picks a month/year and expects the billing period starting in it,
 * ex: with a start day of 5, picking March returns March 5th.
 * @param {Date} date - A date inside the wanted calendar month/year.
 * @param {string} period - Period type: 'day', 'month' or 'year'.
 * @param {number} [startDay] - Day of the month the monthly/yearly period starts on (1-31).
 * @returns {Date} Start of the period, at local midnight.
 * @example
 * getEnergyPeriodStartInCalendarUnit(new Date(2023, 2, 1), 'month', 5); // 2023-03-05 00:00
 */
function getEnergyPeriodStartInCalendarUnit(date, period, startDay = DEFAULT_ENERGY_PERIOD_START_DAY) {
  const currentDate = new Date(date);
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  if (period === ENERGY_PERIODS.YEAR) {
    // January always has 31 days, so the start day never needs to be clamped here.
    return new Date(year, 0, startDay, 0, 0, 0, 0);
  }

  if (period === ENERGY_PERIODS.MONTH) {
    return new Date(year, monthIndex, getPeriodStartDayInMonth(year, monthIndex, startDay), 0, 0, 0, 0);
  }

  return new Date(year, monthIndex, currentDate.getDate(), 0, 0, 0, 0);
}

/**
 * @description Return the start of the period containing a given date, at local midnight.
 * @param {Date} date - Any date inside the wanted period.
 * @param {string} period - Period type: 'day', 'month' or 'year'.
 * @param {number} [startDay] - Day of the month the monthly/yearly period starts on (1-31).
 * @returns {Date} Start of the period, at local midnight.
 * @example
 * getEnergyPeriodStart(new Date(2023, 1, 2), 'month', 5); // 2023-01-05 00:00
 */
function getEnergyPeriodStart(date, period, startDay = DEFAULT_ENERGY_PERIOD_START_DAY) {
  const currentDate = new Date(date);
  const periodStartInCalendarUnit = getEnergyPeriodStartInCalendarUnit(currentDate, period, startDay);
  if (currentDate >= periodStartInCalendarUnit) {
    return periodStartInCalendarUnit;
  }
  // The date is before the start day of its own month/year: it belongs to the previous period.
  // eslint-disable-next-line no-use-before-define
  return getPreviousEnergyPeriodStart(periodStartInCalendarUnit, period, startDay);
}

/**
 * @description Return the start of the period following a given period start.
 * @param {Date} periodStart - Start of a period, as returned by getEnergyPeriodStart.
 * @param {string} period - Period type: 'day', 'month' or 'year'.
 * @param {number} [startDay] - Day of the month the monthly/yearly period starts on (1-31).
 * @returns {Date} Start of the next period, at local midnight.
 * @example
 * getNextEnergyPeriodStart(new Date(2023, 0, 5), 'month', 5); // 2023-02-05 00:00
 */
function getNextEnergyPeriodStart(periodStart, period, startDay = DEFAULT_ENERGY_PERIOD_START_DAY) {
  const currentDate = new Date(periodStart);
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  if (period === ENERGY_PERIODS.YEAR) {
    return new Date(year + 1, 0, startDay, 0, 0, 0, 0);
  }

  if (period === ENERGY_PERIODS.MONTH) {
    return new Date(year, monthIndex + 1, getPeriodStartDayInMonth(year, monthIndex + 1, startDay), 0, 0, 0, 0);
  }

  return new Date(year, monthIndex, currentDate.getDate() + 1, 0, 0, 0, 0);
}

/**
 * @description Return the start of the period preceding a given period start.
 * @param {Date} periodStart - Start of a period, as returned by getEnergyPeriodStart.
 * @param {string} period - Period type: 'day', 'month' or 'year'.
 * @param {number} [startDay] - Day of the month the monthly/yearly period starts on (1-31).
 * @returns {Date} Start of the previous period, at local midnight.
 * @example
 * getPreviousEnergyPeriodStart(new Date(2023, 1, 5), 'month', 5); // 2023-01-05 00:00
 */
function getPreviousEnergyPeriodStart(periodStart, period, startDay = DEFAULT_ENERGY_PERIOD_START_DAY) {
  const currentDate = new Date(periodStart);
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  if (period === ENERGY_PERIODS.YEAR) {
    return new Date(year - 1, 0, startDay, 0, 0, 0, 0);
  }

  if (period === ENERGY_PERIODS.MONTH) {
    return new Date(year, monthIndex - 1, getPeriodStartDayInMonth(year, monthIndex - 1, startDay), 0, 0, 0, 0);
  }

  return new Date(year, monthIndex, currentDate.getDate() - 1, 0, 0, 0, 0);
}

module.exports = {
  ENERGY_PERIODS,
  DEFAULT_ENERGY_PERIOD_START_DAY,
  MIN_ENERGY_PERIOD_START_DAY,
  MAX_ENERGY_PERIOD_START_DAY,
  getDaysInMonth,
  getPeriodStartDayInMonth,
  parseEnergyPeriodStartDay,
  getEnergyPeriodStartInCalendarUnit,
  getEnergyPeriodStart,
  getNextEnergyPeriodStart,
  getPreviousEnergyPeriodStart,
};
