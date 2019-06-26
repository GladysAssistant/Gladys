const db = require('../../models');

/**
 * @public
 * @description Create a house
 * @param {Object} house - New house object.
 * @param {Object} house.name - Name of the new house.
 * @param {Object} [house.selector] - Selector of the new house.
 * @param {Object} [house.latitude] - Latitude of the new house.
 * @param {Object} [house.longitude] - Longitude of the new house.
 * @returns {Promise} Return created house.
 * @example
 * gladys.house.create({
 *    name: 'My house',
 * });
 */
async function create(house) {
  return db.House.create(house);
}

module.exports = {
  create,
};
