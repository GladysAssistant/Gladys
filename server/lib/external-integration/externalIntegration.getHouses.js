const db = require('../../models');
const { ForbiddenError } = require('../../utils/coreErrors');

/**
 * @description Get the houses with their coordinates (GET /house of the host
 * API). The home location is sensitive personal data: like the network
 * captures, access is an authorization contract — an integration that does
 * not declare `location: true` in its manifest (shown on the install screen)
 * gets a 403, enforced server-side. Only the location fields are returned:
 * never the alarm mode, code or delay.
 * @param {object} service - The external integration service.
 * @returns {Promise<Array>} Resolve with the houses (id, name, selector, latitude, longitude).
 * @example
 * const houses = await gladys.externalIntegration.getHouses(service);
 */
async function getHouses(service) {
  if (!service.manifest || service.manifest.location !== true) {
    throw new ForbiddenError('location: access to the house coordinates is not declared in the manifest');
  }
  const houses = await db.House.findAll({
    attributes: ['id', 'name', 'selector', 'latitude', 'longitude'],
    order: [['name', 'ASC']],
  });
  return houses.map((house) => house.get({ plain: true }));
}

module.exports = {
  getHouses,
};
