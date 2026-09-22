const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { MINUTES_PER_DAY } = require('./tariff.constants');

dayjs.extend(utc);
dayjs.extend(timezone);

const MS_PER_MINUTE = 60 * 1000;

/**
 * @description Parse a "HH:MM" label into minutes since midnight ("24:00" = 1440).
 * @param {string} label - Time label.
 * @returns {number} Minutes since midnight.
 * @example
 * parseTimeToMinutes('06:30'); // 390
 */
function parseTimeToMinutes(label) {
  const [hours, minutes] = label.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * @description Parse a "MM-DD" label into a comparable number (MMDD).
 * @param {string} label - Month-day label.
 * @returns {number} MMDD as a number.
 * @example
 * parseMonthDay('11-01'); // 1101
 */
function parseMonthDay(label) {
  const [month, day] = label.split('-').map(Number);
  return month * 100 + day;
}

/**
 * @description Number of days of a month.
 * @param {number} year - Full year.
 * @param {number} month - Month, 1-12.
 * @returns {number} Days in that month.
 * @example
 * getDaysInMonth(2024, 2); // 29
 */
function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * @description Format a year / month / day as "YYYY-MM-DD".
 * @param {number} year - Full year.
 * @param {number} month - Month, 1-12.
 * @param {number} day - Day of month.
 * @returns {string} The date string.
 * @example
 * formatDate(2026, 1, 5); // '2026-01-05'
 */
function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * @description Split a "YYYY-MM-DD" string into numbers.
 * @param {string} dateString - Date string.
 * @returns {object} The parts: year, month, day.
 * @example
 * splitDate('2026-01-05'); // { year: 2026, month: 1, day: 5 }
 */
function splitDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

/**
 * @description Add days to a "YYYY-MM-DD" date (calendar arithmetic, no timezone).
 * @param {string} dateString - Date string.
 * @param {number} days - Days to add (negative allowed).
 * @returns {string} The resulting date string.
 * @example
 * addDays('2026-01-31', 1); // '2026-02-01'
 */
function addDays(dateString, days) {
  const { year, month, day } = splitDate(dateString);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/**
 * @description The UTC instant of a local wall-clock time in a timezone.
 * @param {string} dateString - Local date "YYYY-MM-DD".
 * @param {string} tz - IANA timezone.
 * @param {string} [time] - Local time "HH:MM", midnight by default.
 * @returns {number} Milliseconds since the epoch.
 * @example
 * localToUtcMs('2026-01-05', 'Europe/Paris'); // 1767567600000
 */
function localToUtcMs(dateString, tz, time = '00:00') {
  return dayjs.tz(`${dateString} ${time}:00`, tz).valueOf();
}

/**
 * @description Describe an instant in a timezone: what the conditions of a tariff test.
 * @param {number} ms - Milliseconds since the epoch.
 * @param {string} tz - IANA timezone.
 * @returns {object} { date, year, month, day, monthDay, minutes, weekday } (weekday: 0 = Sunday).
 * @example
 * getLocalContext(Date.UTC(2026, 0, 12, 7), 'Europe/Paris'); // { date: '2026-01-12', minutes: 480, weekday: 1, ... }
 */
function getLocalContext(ms, tz) {
  const local = dayjs(ms).tz(tz);
  const month = local.month() + 1;
  const day = local.date();
  return {
    date: formatDate(local.year(), month, day),
    year: local.year(),
    month,
    day,
    monthDay: month * 100 + day,
    minutes: local.hour() * 60 + local.minute(),
    weekday: local.day(),
  };
}

/**
 * @description Bounds of a local day: [start of the day, start of the next day).
 * @param {string} dateString - Local date.
 * @param {string} tz - IANA timezone.
 * @returns {object} { startMs, endMs, durationMinutes } (1380, 1440 or 1500 on clock-change days).
 * @example
 * getDayBounds('2026-03-29', 'Europe/Paris').durationMinutes; // 1380
 */
function getDayBounds(dateString, tz) {
  const startMs = localToUtcMs(dateString, tz);
  const endMs = localToUtcMs(addDays(dateString, 1), tz);
  return { startMs, endMs, durationMinutes: (endMs - startMs) / MS_PER_MINUTE };
}

/**
 * @description Bounds of the calendar month of a local date.
 * @param {string} dateString - Local date.
 * @param {string} tz - IANA timezone.
 * @returns {object} { startMs, endMs, durationMinutes, id } (id = "YYYY-MM").
 * @example
 * getMonthBounds('2026-02-10', 'Europe/Paris').durationMinutes; // 40320
 */
function getMonthBounds(dateString, tz) {
  const { year, month } = splitDate(dateString);
  const startMs = localToUtcMs(formatDate(year, month, 1), tz);
  const nextMonth = month === 12 ? formatDate(year + 1, 1, 1) : formatDate(year, month + 1, 1);
  const endMs = localToUtcMs(nextMonth, tz);
  return {
    startMs,
    endMs,
    durationMinutes: (endMs - startMs) / MS_PER_MINUTE,
    id: `${year}-${String(month).padStart(2, '0')}`,
  };
}

/**
 * @description Local date a billing period starts on, for the period containing a date.
 * The period starts on `startDay` (clamped to the last day of short months).
 * @param {string} dateString - Local date.
 * @param {number} startDay - Billing period start day (1-31).
 * @returns {string} Start date of the period ("YYYY-MM-DD").
 * @example
 * getBillingPeriodStart('2026-02-03', 5); // '2026-01-05'
 */
function getBillingPeriodStart(dateString, startDay) {
  const { year, month, day } = splitDate(dateString);
  const startThisMonth = Math.min(startDay, getDaysInMonth(year, month));
  if (day >= startThisMonth) {
    return formatDate(year, month, startThisMonth);
  }
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  return formatDate(previousYear, previousMonth, Math.min(startDay, getDaysInMonth(previousYear, previousMonth)));
}

/**
 * @description Bounds of the billing period containing a local date.
 * @param {string} dateString - Local date.
 * @param {number} startDay - Billing period start day (1-31).
 * @param {string} tz - IANA timezone.
 * @returns {object} { startMs, endMs, durationMinutes, id } (id = start date of the period).
 * @example
 * getBillingPeriodBounds('2026-02-03', 5, 'Europe/Paris').id; // '2026-01-05'
 */
function getBillingPeriodBounds(dateString, startDay, tz) {
  const start = getBillingPeriodStart(dateString, startDay);
  const { year, month } = splitDate(start);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const next = formatDate(nextYear, nextMonth, Math.min(startDay, getDaysInMonth(nextYear, nextMonth)));
  const startMs = localToUtcMs(start, tz);
  const endMs = localToUtcMs(next, tz);
  return { startMs, endMs, durationMinutes: (endMs - startMs) / MS_PER_MINUTE, id: start };
}

/**
 * @description Tell whether a minute of the day falls in a compiled time range list.
 * @param {Array<object>} ranges - Compiled ranges [{ start, end }) in minutes.
 * @param {number} minutes - Minutes since local midnight.
 * @returns {boolean} True when inside one of the ranges.
 * @example
 * isInTimeRanges([{ start: 1320, end: 1440 }, { start: 0, end: 360 }], 30); // true
 */
function isInTimeRanges(ranges, minutes) {
  return ranges.some((range) => minutes >= range.start && minutes < range.end);
}

/**
 * @description Compile a list of ["HH:MM", "HH:MM"] intervals into [start, end) minute ranges,
 * splitting the ones that cross midnight.
 * @param {Array<Array<string>>} intervals - Time intervals.
 * @returns {Array<object>} Ranges { start, end } in minutes.
 * @example
 * compileTimeIntervals([['22:00', '06:00']]); // [{ start: 1320, end: 1440 }, { start: 0, end: 360 }]
 */
function compileTimeIntervals(intervals) {
  const ranges = [];
  intervals.forEach(([from, to]) => {
    const start = parseTimeToMinutes(from);
    const end = parseTimeToMinutes(to);
    if (end > start) {
      ranges.push({ start, end });
    } else {
      ranges.push({ start, end: MINUTES_PER_DAY });
      ranges.push({ start: 0, end });
    }
  });
  return ranges;
}

module.exports = {
  MS_PER_MINUTE,
  parseTimeToMinutes,
  parseMonthDay,
  getDaysInMonth,
  formatDate,
  splitDate,
  addDays,
  localToUtcMs,
  getLocalContext,
  getDayBounds,
  getMonthBounds,
  getBillingPeriodStart,
  getBillingPeriodBounds,
  isInTimeRanges,
  compileTimeIntervals,
};
