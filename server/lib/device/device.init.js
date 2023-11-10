const db = require('../../models');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Init devices in local RAM.
 * @param {boolean} startDeviceStateAggregate - Start the device aggregate task.
 * @returns {Promise} Resolve with inserted devices.
 * @example
 * gladys.device.init();
 */
async function init(startDeviceStateAggregate = true) {
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
    this.brain.addNamedEntity('device', plainDevice.selector, plainDevice.name);
    return plainDevice;
  });
  if (startDeviceStateAggregate) {
    // calculate aggregate data for device states
    this.eventManager.emit(EVENTS.DEVICE.CALCULATE_HOURLY_AGGREGATE);
  }
  // setup polling for device who need polling
  this.setupPoll();
  return plainDevices;
}

module.exports = {
  init,
};
