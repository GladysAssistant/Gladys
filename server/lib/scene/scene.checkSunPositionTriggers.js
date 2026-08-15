const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

const RADIAN_TO_DEGREE = 180 / Math.PI;

/**
 * @description Convert a sun position returned by suncalc to degrees.
 * Suncalc returns radians, with an azimuth measured from South going West
 * (0 = South, PI/2 = West). Gladys exposes the usual compass convention
 * instead: degrees from North (0 = North, 90 = East, 180 = South, 270 = West).
 * @param {object} position - Position returned by sunCalc.getPosition.
 * @param {number} position.altitude - Altitude in radians, above the horizon.
 * @param {number} position.azimuth - Azimuth in radians, from South.
 * @returns {object} The position in degrees, rounded to 2 decimals.
 * @example
 * const position = convertSunPositionToDegrees({ altitude: 0, azimuth: 0 });
 */
function convertSunPositionToDegrees({ altitude, azimuth }) {
  // The JS remainder keeps the sign of its left operand, so a second modulo is needed
  // to always land in [0, 360[.
  const azimuthInDegree = (((azimuth * RADIAN_TO_DEGREE + 180) % 360) + 360) % 360;
  const roundedAzimuth = Math.round(azimuthInDegree * 100) / 100;
  return {
    altitude: Math.round(altitude * RADIAN_TO_DEGREE * 100) / 100,
    // Rounding an azimuth just below North (359.999°) gives exactly 360: bring it back
    // to 0, so that North is always exposed as 0 and never as 360.
    azimuth: roundedAzimuth >= 360 ? roundedAzimuth - 360 : roundedAzimuth,
  };
}

/**
 * @description Run every minute to check if the sun position matches a scene trigger.
 * @returns {Promise} Resolve when all houses have been checked.
 * @example
 * gladys.scene.checkSunPositionTriggers();
 */
async function checkSunPositionTriggers() {
  // Computing the sun position is cheap, but getting the houses is a DB call:
  // we only do it when at least one active scene listens to this trigger.
  const someSceneListens = Object.values(this.scenes).some(
    (scene) =>
      scene.active &&
      scene.triggers instanceof Array &&
      scene.triggers.some((trigger) => trigger.type === EVENTS.TIME.SUN_POSITION),
  );
  if (!someSceneListens) {
    return;
  }
  const houses = await this.house.get();
  houses.forEach((house) => {
    if (house.latitude === null || house.longitude === null) {
      return;
    }
    const position = convertSunPositionToDegrees(this.sunCalc.getPosition(new Date(), house.latitude, house.longitude));
    const previousPosition = this.sunPositions.get(house.selector);
    this.sunPositions.set(house.selector, position);
    // The trigger fires when the sun enters the area configured by the user, so
    // we need a previous position to compare with. On the first check of a house
    // (Gladys just started), we only save the position.
    if (!previousPosition) {
      logger.debug(`Sun position in house ${house.selector}: first check, saving position.`);
      return;
    }
    logger.debug(
      `Sun position in house ${house.selector}: altitude = ${position.altitude}°, azimuth = ${position.azimuth}°.`,
    );
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.TIME.SUN_POSITION,
      house,
      altitude: position.altitude,
      azimuth: position.azimuth,
      previous_altitude: previousPosition.altitude,
      previous_azimuth: previousPosition.azimuth,
    });
  });
}

module.exports = {
  checkSunPositionTriggers,
  convertSunPositionToDegrees,
};
