const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

/**
 * @description Get the Enercoop season for a date.
 * Summer runs from April to October, winter from November to March.
 * @param {Date} date - The date to evaluate.
 * @param {string} systemTimezone - The system timezone.
 * @returns {'summer'|'winter'} The Enercoop season.
 */
function getEnercoopSeason(date, systemTimezone) {
  const month =
    dayjs(date)
      .tz(systemTimezone)
      .month() + 1;
  return month >= 4 && month <= 10 ? 'summer' : 'winter';
}

module.exports = {
  getEnercoopSeason,
};
