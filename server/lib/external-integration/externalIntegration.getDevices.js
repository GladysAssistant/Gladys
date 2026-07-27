const db = require('../../models');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');

/**
 * @description Get the devices of an integration really created by the user
 * (read only, standard device format). Lets the integration know what to
 * control/poll at startup.
 * @param {object} service - The external integration service.
 * @returns {Promise<Array>} Resolve with the devices of the integration.
 * @example
 * const devices = await gladys.externalIntegration.getDevices(service);
 */
async function getDevices(service) {
  const devices = await db.Device.findAll({
    include: getStandardDeviceIncludes(),
    where: {
      service_id: service.id,
    },
    order: [['name', 'ASC']],
  });
  return devices.map((device) => device.get({ plain: true }));
}

module.exports = {
  getDevices,
};
