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

  if (devices && devices.length > 0) {
    await Promise.each(devices, async (device) => {
      await device.destroy(device.selector);
    });
  }
  return null;
}

module.exports = {
  destroyByServiceId,
};
