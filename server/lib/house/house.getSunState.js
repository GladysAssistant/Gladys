const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezonePlugin = require('dayjs/plugin/timezone');
const SunCalc = require('suncalc');

const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DEFAULT_TIMEZONE = 'Europe/Paris';
const CURVE_STEP_MINUTES = 20;
const MINUTES_IN_DAY = 24 * 60;

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
  // Take the sun times of the local day, not of the day in the server timezone
  // (official Gladys images run in UTC): use local noon as the reference date.
  const localNoon = dayjs(now)
    .tz(timezone)
    .hour(12)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toDate();
  const times = SunCalc.getTimes(localNoon, latitude, longitude);
  const position = SunCalc.getPosition(now, latitude, longitude);

  // The curve spans the local day, so sunrise/sunset always fall inside it
  const startOfDay = dayjs(now)
    .tz(timezone)
    .startOf('day');

  /** @type {Array<{time: Date, elevation: number}>} */
  const curve = [];
  for (let minutes = 0; minutes <= MINUTES_IN_DAY; minutes += CURVE_STEP_MINUTES) {
    const time = startOfDay.add(minutes, 'minute').toDate();
    const { altitude } = SunCalc.getPosition(time, latitude, longitude);
    curve.push({ time, elevation: roundTwoDecimals(toDegrees(altitude)) });
  }

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
