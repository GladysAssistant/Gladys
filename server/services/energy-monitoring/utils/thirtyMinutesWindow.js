const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description Round a date down to the nearest 30-minute mark (:00 or :30) in the given timezone.
 * All code producing thirty-minute window timestamps must use these helpers so the scheduled
 * path and the backfill path bucket to the same timestamps, whatever the timezone UTC offset.
 * @param {Date|object} date - The date to round (Date or dayjs instance).
 * @param {string} timezoneName - The IANA timezone name to round in.
 * @returns {object} A dayjs instance rounded down to :00 or :30.
 * @example
 * floorToThirtyMinutes(new Date(), 'Europe/Paris');
 */
function floorToThirtyMinutes(date, timezoneName) {
  const time = dayjs(date).tz(timezoneName);
  return time
    .minute(time.minute() < 30 ? 0 : 30)
    .second(0)
    .millisecond(0);
}

/**
 * @description Round a date up to the next 30-minute mark (:30 or next :00) in the given timezone.
 * @param {Date|object} date - The date to round (Date or dayjs instance).
 * @param {string} timezoneName - The IANA timezone name to round in.
 * @returns {object} A dayjs instance rounded up to :30 or the next :00.
 * @example
 * ceilToNextThirtyMinutes(new Date(), 'Europe/Paris');
 */
function ceilToNextThirtyMinutes(date, timezoneName) {
  const time = dayjs(date).tz(timezoneName);
  return time
    .minute(time.minute() < 30 ? 30 : 60)
    .second(0)
    .millisecond(0);
}

module.exports = {
  floorToThirtyMinutes,
  ceilToNextThirtyMinutes,
};
