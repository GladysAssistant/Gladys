const dayjs = require('dayjs');

/**
 * @description Compute Easter Sunday for a given year (Gregorian calendar).
 * @param {number} year - The year.
 * @returns {dayjs.Dayjs} Easter Sunday date.
 */
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
}

/**
 * @description Build the set of French national public holidays for a given year.
 * @param {number} year - The year.
 * @returns {Set<string>} Set of dates formatted as YYYY-MM-DD.
 */
function getFrenchPublicHolidaysForYear(year) {
  const easterSunday = getEasterSunday(year);
  const holidays = [
    dayjs(`${year}-01-01`),
    easterSunday.add(1, 'day'),
    dayjs(`${year}-05-01`),
    dayjs(`${year}-05-08`),
    easterSunday.add(39, 'day'),
    easterSunday.add(50, 'day'),
    dayjs(`${year}-07-14`),
    dayjs(`${year}-08-15`),
    dayjs(`${year}-11-01`),
    dayjs(`${year}-11-11`),
    dayjs(`${year}-12-25`),
  ];

  return new Set(holidays.map((date) => date.format('YYYY-MM-DD')));
}

const holidaysCache = new Map();

/**
 * @description Check if a date is a French national public holiday.
 * @param {string} dateString - The date formatted as YYYY-MM-DD.
 * @returns {boolean} True when the date is a French public holiday.
 */
function isFrenchPublicHoliday(dateString) {
  const year = Number(dateString.split('-')[0]);
  if (!holidaysCache.has(year)) {
    holidaysCache.set(year, getFrenchPublicHolidaysForYear(year));
  }
  return holidaysCache.get(year).has(dateString);
}

module.exports = {
  getEasterSunday,
  getFrenchPublicHolidaysForYear,
  isFrenchPublicHoliday,
};
