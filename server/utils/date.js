const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @description Format a date in UTC string.
 * @param {Date} date - Javascript date.
 * @returns {string} - Return a formatted string, utc time.
 * @example const dateStringUtc = formatDateInUTC(new Date());
 */
function formatDateInUTC(date) {
  // Convert date to UTC
  const dateInUTC = dayjs(date).utc();

  // Format the date
  const formattedDate = dateInUTC.format('YYYY-MM-DD HH:mm:ss.SSSSSS');

  // Append the UTC offset
  return `${formattedDate}+00`;
}

module.exports = {
  formatDateInUTC,
};
