const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Destroy a device by service id.
 * @param {string} serviceId - Device service id.
 * @example
 * device.destroyByServiceId('serviceId');
 */
async function destroyByServiceId(serviceId) {
  const devices = await db.Device.findAll({
    include: [
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.DeviceFeature,
        as: 'features',
      },
    ],
    where: {
      service_id: { [Op.eq]: `${serviceId}` },
    },
  });

  devices.map(async (device) => {
    device.destroy(device.selector);
  });

  return null;
}

module.exports = {
  destroyByServiceId,
};
