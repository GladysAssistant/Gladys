const db = require('../../models');
const { EVENTS } = require('../../utils/constants');

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
  const newHouse = await db.House.create(house);
  this.event.emit(EVENTS.HOUSE.CREATED, newHouse.get({ plain: true }));
  return newHouse;
}

module.exports = {
  create,
};
