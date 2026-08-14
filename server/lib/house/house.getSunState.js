const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezonePlugin = require('dayjs/plugin/timezone');
const SunCalc = require('suncalc');

const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DEFAULT_TIMEZONE = 'Europe/Paris';
const CURVE_STEP_MINUTES = 20;

/**
 * @description Convert radians to degrees.
 * @param {number} radians - Angle in radians.
 * @returns {number} Angle in degrees.
 * @example
 * const degrees = toDegrees(Math.PI);
 */
function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * @description Round a number to 2 decimals.
 * @param {number} value - Value to round.
 * @returns {number} Rounded value.
 * @example
 * const rounded = roundTwoDecimals(3.14159);
 */
function roundTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @description Return null instead of an Invalid Date.
 * @param {Date} date - Date returned by SunCalc.
 * @returns {Date} The date, or null if SunCalc could not compute it.
 * @example
 * const sunrise = nullIfInvalidDate(times.sunrise);
 */
function nullIfInvalidDate(date) {
  // In polar day/night, SunCalc returns an Invalid Date: the sun never
  // crosses the horizon, so the event does not exist on that day.
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * @public
 * @description Get sun times, current sun position and daily elevation curve for a house.
 * @param {any} house - House with latitude and longitude.
 * @param {Date} [now] - Date at which the sun state is computed.
 * @returns {Promise<object>} Sun times, current azimuth/elevation and elevation curve of the day.
 * @example
 * const sunState = await gladys.house.getSunState(house);
 */
async function getSunState(house, now = new Date()) {
  const { latitude, longitude } = house;
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || DEFAULT_TIMEZONE;
  // Work on the local day, not on the day in the server timezone (official
  // Gladys images run in UTC). Times are re-parsed from their local date as
  // wall clock times: adding to a dayjs.tz object keeps the original UTC
  // offset, which would be wrong on a DST day (the local day then lasts 23 or
  // 25 hours, not 24).
  const localDay = dayjs(now).tz(timezone);
  const today = localDay.format('YYYY-MM-DD');
  const tomorrow = localDay.add(1, 'day').format('YYYY-MM-DD');

  // Local noon is the reference date, so the sun times are the ones of the local day
  const localNoon = dayjs.tz(`${today} 12:00:00`, timezone).toDate();
  const times = SunCalc.getTimes(localNoon, latitude, longitude);
  const position = SunCalc.getPosition(now, latitude, longitude);

  // The curve spans the local day, so sunrise/sunset always fall inside it
  const startOfDay = dayjs.tz(`${today} 00:00:00`, timezone);
  const endOfDay = dayjs.tz(`${tomorrow} 00:00:00`, timezone);
  const startTime = startOfDay.valueOf();
  const endTime = endOfDay.valueOf();

  /** @type {Array<{time: Date, elevation: number}>} */
  const curve = [];
  for (let time = startTime; time < endTime; time += CURVE_STEP_MINUTES * 60 * 1000) {
    const date = new Date(time);
    const { altitude } = SunCalc.getPosition(date, latitude, longitude);
    curve.push({ time: date, elevation: roundTwoDecimals(toDegrees(altitude)) });
  }
  // Always close the curve on the next local midnight
  const endDate = new Date(endTime);
  const { altitude } = SunCalc.getPosition(endDate, latitude, longitude);
  curve.push({ time: endDate, elevation: roundTwoDecimals(toDegrees(altitude)) });

  return {
    dawn: nullIfInvalidDate(times.dawn),
    sunrise: nullIfInvalidDate(times.sunrise),
    solar_noon: nullIfInvalidDate(times.solarNoon),
    sunset: nullIfInvalidDate(times.sunset),
    dusk: nullIfInvalidDate(times.dusk),
    // SunCalc azimuth is in radians, measured from south (westward positive):
    // convert it to degrees from north, clockwise, like a compass bearing
    azimuth: roundTwoDecimals((toDegrees(position.azimuth) + 180 + 360) % 360),
    elevation: roundTwoDecimals(toDegrees(position.altitude)),
    curve,
  };
}

module.exports = {
  getSunState,
};
