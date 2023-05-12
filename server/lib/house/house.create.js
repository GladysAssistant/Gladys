const db = require('../../models');
const { EVENTS } = require('../../utils/constants');

/**
 * @public
 * @description Create a house.
 * @param {object} house - New house object.
 * @param {object} house.name - Name of the new house.
 * @param {object} [house.selector] - Selector of the new house.
 * @param {object} [house.latitude] - Latitude of the new house.
 * @param {object} [house.longitude] - Longitude of the new house.
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
