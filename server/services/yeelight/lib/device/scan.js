const logger = require('../../../../utils/logger');
const { getYeelightColorLight } = require('../models/color');
const { getYeelightUnhandledLight } = require('../models/unhandled');
const { getYeelightWhiteLight } = require('../models/white');
const { DEVICE_EXTERNAL_ID_BASE, DEVICES_MODELS } = require('../utils/constants');

/**
 * @description Send a broadcast to find the devices
 * @returns {Promise<Array>} Resolve with array of new devices.
 * @example
 * scan();
 */
async function scan() {
  const discover = new this.yeelightApi.Discover();
  let discoveredDevices = [];
  try {
    discoveredDevices = await discover.start();
  } catch (error) {
    logger.warn(error);
  }
  await discover.destroy();

  const unknownDevices = [];

  // If devices are found...
  logger.info(`${discoveredDevices.length} device(s) found while scanning !`);
  if (discoveredDevices.length) {
    // ...check, for each of them, if it is already in Gladys...
    discoveredDevices.forEach((discoveredDevice) => {
      const deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.id}`;
      const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
      if (deviceInGladys) {
        logger.debug(`Device "${discoveredDevice.id}" is already in Gladys !`);
      } else {
        logger.debug(`Device "${discoveredDevice.id}" found, model: "${discoveredDevice.model}"`);

        let newDevice;
        if (Object.keys(DEVICES_MODELS).includes(discoveredDevice.model)) {
          // ...else, if the model is supported...
          if (discoveredDevice.capabilities.includes('set_rgb') && discoveredDevice.capabilities.includes('set_hsv')) {
            // ...and has color ability, create a color light device...
            newDevice = getYeelightColorLight(discoveredDevice, this.serviceId);
          } else {
            // ...else, create a white light device...
            newDevice = getYeelightWhiteLight(discoveredDevice, this.serviceId);
          }
        } else {
          // ...else the device is not yet handled.
          logger.info(`Device model "${discoveredDevice.model}" not handled yet !`);
          newDevice = getYeelightUnhandledLight(discoveredDevice, this.serviceId);
        }
        unknownDevices.push(newDevice);
      }
    });
  }
  logger.debug(`DEBUG return: ${JSON.stringify(unknownDevices)}`);
  return unknownDevices;
}

module.exports = {
  scan,
};
