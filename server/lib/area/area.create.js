const db = require('../../models');

/**
 * @description Create an area.
 * @param {Object} area - An area object.
 * @returns {Promise} Resolve with created area.
 * @example
 * gladys.area.create({
 *    name: 'Work',
 *    latitude: 10,
 *    longitude: 10,
 *    radius: 200
 *    color: '#00000'
 * });
 */
async function create(area) {
  return db.Area.create(area);
}

module.exports = {
  create,
};
