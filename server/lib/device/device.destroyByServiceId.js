const Promise = require('bluebird');
const db = require('../../models');

/**
 * @description Destroy a device by service id.
 * @param {string} serviceId - Device service id.
 * @example
 * device.destroyByServiceId('serviceId');
 */
async function destroyByServiceId(serviceId) {
  const devices = await db.Device.findAll({
    where: {
      service_id: serviceId,
    },
  });

  await Promise.each(devices, async (device) => {
    await device.destroy();
  });

  return null;
}

module.exports = {
  destroyByServiceId,
};
