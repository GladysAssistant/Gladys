const { Op } = require('sequelize');
const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');

/**
 * @description Wrap a longitude the way Leaflet's LatLng.wrap() does, so that
 * it always lies between -180 and +180 degrees, +180 being kept as is.
 * @param {number} longitude - The longitude to wrap, in degrees.
 * @returns {number} The same position, expressed between -180 and +180.
 * @example
 * wrapLongitude(236.031002998352); // -123.968997001648
 */
function wrapLongitude(longitude) {
  if (longitude === 180) {
    return longitude;
  }
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

module.exports = {
  up: async () => {
    // Clicking the map on a repeated copy of the world used to save the raw
    // longitude of that copy, outside the -180/+180 range (e.g. +236 instead
    // of -124). The position is geographically right, but every service given
    // those coordinates rejects them. The wrapping is done in JavaScript
    // because SQLite's % operator truncates its operands to integers, which
    // would silently round the longitude to the nearest degree.
    const houses = await db.House.findAll({
      attributes: ['id', 'name', 'longitude'],
      where: {
        longitude: {
          [Op.or]: {
            [Op.lt]: -180,
            [Op.gt]: 180,
          },
        },
      },
    });
    if (houses.length === 0) {
      return;
    }
    logger.info(`Wrapping the longitude of ${houses.length} house(s) outside the -180/+180 range`);
    await Promise.each(houses, async (house) => {
      const longitude = wrapLongitude(house.longitude);
      logger.info(`House ${house.name}: longitude ${house.longitude} -> ${longitude}`);
      await house.update({ longitude });
    });
  },

  down: async () => {},
};
