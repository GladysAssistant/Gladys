import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SYSTEM_VARIABLE_NAMES } from '../../../server/utils/constants';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Paris';

const ONE_DAY_IN_MINUTES = 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;

/**
 * @description Format a timestamp in the Gladys system timezone.
 * @param {number|string|Date} timestamp - Timestamp to format.
 * @param {string} format - dayjs format string.
 * @param {string} language - User language for localization.
 * @param {string} [timezoneName] - IANA timezone name.
 * @returns {string} Formatted date string.
 */
function formatInSystemTimezone(timestamp, format, language, timezoneName = DEFAULT_TIMEZONE) {
  return dayjs(timestamp)
    .tz(timezoneName)
    .locale(language)
    .format(format);
}

/**
 * @description Get the x-axis date format based on chart interval in minutes.
 * @param {number} intervalMinutes - Chart interval in minutes.
 * @returns {string} dayjs format string.
 */
function getXAxisDateFormatForInterval(intervalMinutes) {
  if (!intervalMinutes || intervalMinutes <= ONE_DAY_IN_MINUTES) {
    return 'HH:mm';
  }
  if (intervalMinutes <= SEVEN_DAYS_IN_MINUTES) {
    return 'DD MMM';
  }
  if (intervalMinutes <= THIRTY_DAYS_IN_MINUTES) {
    return 'DD MMM';
  }
  return 'MMM YY';
}

/**
 * @description Get the tooltip date format based on chart interval in minutes.
 * @param {number} intervalMinutes - Chart interval in minutes.
 * @returns {string} dayjs format string.
 */
function getTooltipDateFormatForInterval(intervalMinutes) {
  if (!intervalMinutes || intervalMinutes <= ONE_DAY_IN_MINUTES) {
    return 'LLL';
  }
  return 'LL';
}

/**
 * @description Load the Gladys system timezone from the API.
 * @param {object} httpClient - HTTP client instance.
 * @returns {Promise<string>} IANA timezone name.
 */
async function fetchSystemTimezone(httpClient) {
  try {
    const { value } = await httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`);
    return value || DEFAULT_TIMEZONE;
  } catch (e) {
    return DEFAULT_TIMEZONE;
  }
}

export {
  DEFAULT_TIMEZONE,
  formatInSystemTimezone,
  getXAxisDateFormatForInterval,
  getTooltipDateFormatForInterval,
  fetchSystemTimezone
};
