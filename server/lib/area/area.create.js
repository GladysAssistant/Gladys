const db = require('../../models');

/**
 * @description Create an area.
 * @param {object} area - An area object.
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
  const areaCreated = await db.Area.create(area);
  this.areas.push(areaCreated);
  return areaCreated;
}

module.exports = {
  create,
};
