const { calculateDistanceBetweenTwoPoints } = require('../../utils/coordinates');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Check if the new location of the user is in an area
 * @param {Object} event - The new location event.
 * @example
 * checkNewLocation(location);
 */
function checkNewLocation({ userSelector, previousLocation, newLocation }) {
  const areasTheUserWasIn = new Set();
  const areasTheUserIsIn = new Set();
  this.areas.forEach((area) => {
    const distanceWitPreviousLocation = calculateDistanceBetweenTwoPoints(
      area.latitude,
      area.longitude,
      previousLocation.latitude,
      previousLocation.longitude,
    );
    if (distanceWitPreviousLocation <= area.radius) {
      areasTheUserWasIn.add(area.selector);
    }
    const distanceWitNewLocation = calculateDistanceBetweenTwoPoints(
      area.latitude,
      area.longitude,
      newLocation.latitude,
      newLocation.longitude,
    );
    if (distanceWitNewLocation <= area.radius) {
      areasTheUserIsIn.add(area.selector);
    }
  });
  areasTheUserIsIn.forEach((areaTheUserIsIn) => {
    if (!areasTheUserWasIn.has(areaTheUserIsIn)) {
      logger.info(`User ${userSelector} just arrived in area ${areaTheUserIsIn}`);
      this.event.emit(EVENTS.AREA.USER_ENTERED, {
        area: areaTheUserIsIn,
        user: userSelector,
      });
    }
  });
  areasTheUserWasIn.forEach((areaTheUserWasIn) => {
    if (!areasTheUserIsIn.has(areaTheUserWasIn)) {
      logger.info(`User ${userSelector} just left the area ${areaTheUserWasIn}`);
      this.event.emit(EVENTS.AREA.USER_LEFT, {
        area: areaTheUserWasIn,
        user: userSelector,
      });
    }
  });
  return {
    areasTheUserIsIn,
    areasTheUserWasIn,
  };
}

module.exports = {
  checkNewLocation,
};
