const SunCalc = require('suncalc');

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
 * @public
 * @description Get sun times, current sun position and daily elevation curve for a house.
 * @param {any} house - House with latitude and longitude.
 * @param {Date} [now] - Date at which the sun state is computed.
 * @returns {object} Sun times, current azimuth/elevation and elevation curve of the day.
 * @example
 * const sunState = gladys.house.getSunState(house);
 */
function getSunState(house, now = new Date()) {
  const { latitude, longitude } = house;
  const times = SunCalc.getTimes(now, latitude, longitude);
  const position = SunCalc.getPosition(now, latitude, longitude);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  /** @type {Array<{time: Date, elevation: number}>} */
  const curve = [];
  for (let minutes = 0; minutes <= MINUTES_IN_DAY; minutes += CURVE_STEP_MINUTES) {
    const time = new Date(startOfDay.getTime() + minutes * 60 * 1000);
    const { altitude } = SunCalc.getPosition(time, latitude, longitude);
    curve.push({ time, elevation: roundTwoDecimals(toDegrees(altitude)) });
  }

  return {
    dawn: times.dawn,
    sunrise: times.sunrise,
    solar_noon: times.solarNoon,
    sunset: times.sunset,
    dusk: times.dusk,
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
