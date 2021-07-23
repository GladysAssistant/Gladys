const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Init devices in local RAM
 * @returns {Promise} Resolve with inserted devices.
 * @example
 * gladys.device.init();
 */
async function init() {
  // load all devices in RAM
  const devices = await db.Device.findAll({
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
  logger.debug(`Device : init : Found ${devices.length} devices`);
  const plainDevices = devices.map((device) => {
    const plainDevice = device.get({ plain: true });
    this.add(plainDevice);
    return plainDevice;
  });
  // calculate aggregate data for device states
  await this.calculateAggregate('hourly');
  await this.calculateAggregate('monthly');
  await this.calculateAggregate('daily');
  // setup polling for device who need polling
  this.setupPoll();
  return plainDevices;
}

module.exports = {
  init,
};
