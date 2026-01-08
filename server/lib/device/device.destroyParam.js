const db = require('../../models');

/**
 * @description Create/Update a deviceParam.
 * @param {object} device - The device where the param should be created.
 * @param {string} name - The name of the param.
 * @example
 * destroyParam({id: '57aa7f5c-fd6f-410d-81f1-f31e6012fdd9'}, 'ENERGY_INDEX_LAST_PROCESSED');
 */
async function destroyParam(device, name) {
  const deviceParam = await db.DeviceParam.findOne({
    where: {
      name,
      device_id: device.id,
    },
  });
  if (deviceParam !== null) {
    await deviceParam.destroy();
  }
  // Reload the full device from DB with all features (same pattern as device.init)
  const fullDevice = await db.Device.findOne({
    where: { id: device.id },
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
      },
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.Room,
        as: 'room',
      },
      {
        model: db.Service,
        as: 'service',
      },
    ],
  });

  if (fullDevice) {
    const plainDevice = fullDevice.get({ plain: true });
    // Use device.add to update all caches consistently
    this.add(plainDevice);
  }
}

module.exports = {
  destroyParam,
};
