const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_ALTITUDE_TOLERANCE = 0.5;
const DEFAULT_AZIMUTH_TOLERANCE = 1;

/**
 * @description Convert suncalc position (radians) to degrees.
 * Altitude is measured from the horizon (0° = horizon, 90° = zenith).
 * Azimuth is measured clockwise from north (0° = north, 90° = east, 180° = south, 270° = west).
 * @param {object} position - suncalc getPosition result.
 * @returns {{ altitude: number, azimuth: number }} Position in degrees.
 */
function toDegrees(position) {
  const altitude = (position.altitude * 180) / Math.PI;
  const azimuth = ((position.azimuth * 180) / Math.PI + 180) % 360;
  return { altitude, azimuth };
}

/**
 * @description Smallest angular difference between two azimuth values (0-360).
 * @param {number} a - First azimuth in degrees.
 * @param {number} b - Second azimuth in degrees.
 * @returns {number} Angular difference in degrees.
 */
function azimuthDifference(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * @description Check if sun position matches target altitude and azimuth within tolerance.
 * @param {number} altitude - Current altitude in degrees.
 * @param {number} azimuth - Current azimuth in degrees.
 * @param {number} targetAltitude - Target altitude in degrees.
 * @param {number} targetAzimuth - Target azimuth in degrees.
 * @param {number} [altitudeTolerance] - Altitude tolerance in degrees.
 * @param {number} [azimuthTolerance] - Azimuth tolerance in degrees.
 * @returns {boolean} True if position matches.
 */
function matchesSunPosition(
  altitude,
  azimuth,
  targetAltitude,
  targetAzimuth,
  altitudeTolerance = DEFAULT_ALTITUDE_TOLERANCE,
  azimuthTolerance = DEFAULT_AZIMUTH_TOLERANCE,
) {
  return (
    Math.abs(altitude - targetAltitude) <= altitudeTolerance &&
    azimuthDifference(azimuth, targetAzimuth) <= azimuthTolerance
  );
}

/**
 * @description Find times during a day when the sun reaches a target altitude and azimuth.
 * @param {object} sunCalc - suncalc module.
 * @param {number} latitude - House latitude.
 * @param {number} longitude - House longitude.
 * @param {string} timezoneName - User timezone.
 * @param {number} targetAltitude - Target altitude in degrees (-90 to 90).
 * @param {number} targetAzimuth - Target azimuth in degrees (0-360).
 * @returns {Date[]} Matching times during the day (at most one per crossing window).
 */
function findSunPositionTimes(sunCalc, latitude, longitude, timezoneName, targetAltitude, targetAzimuth) {
  const today = dayjs()
    .tz(timezoneName)
    .startOf('day');
  const matches = [];
  let inMatchWindow = false;

  for (let minute = 0; minute < 24 * 60; minute += 1) {
    const date = today.add(minute, 'minute').toDate();
    const { altitude, azimuth } = toDegrees(sunCalc.getPosition(date, latitude, longitude));
    const isMatch = matchesSunPosition(altitude, azimuth, targetAltitude, targetAzimuth);

    if (isMatch && !inMatchWindow) {
      matches.push(date);
      inMatchWindow = true;
    } else if (!isMatch) {
      inMatchWindow = false;
    }
  }

  return matches;
}

module.exports = {
  toDegrees,
  azimuthDifference,
  matchesSunPosition,
  findSunPositionTimes,
  DEFAULT_ALTITUDE_TOLERANCE,
  DEFAULT_AZIMUTH_TOLERANCE,
};
