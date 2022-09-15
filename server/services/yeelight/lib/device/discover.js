const logger = require('../../../../utils/logger');
const features = require('../features');
const { DEVICE_EXTERNAL_ID_BASE } = require('../utils/constants');

/**
 * @description Send a broadcast to find the devices.
 * @returns {Promise<Array>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  const unknownDevices = [];
  if (!this.discoveryInProgress) {
    logger.debug(`Yeelight: Discovery in progress...`);
    this.discoveryInProgress = true;

    if (!this.discovery || this.discovery.isDestroyed) {
      this.discovery = new this.yeelightApi.Discover({ fallback: false });
    }

    this.discovery.on('error', (error) => {
      throw error;
    });

    setTimeout(() => {
      this.discoveryInProgress = false;
      this.discovery.destroy();
    }, 10000);

    const discoveredDevices = await this.discovery.start();
    discoveredDevices.forEach((discoveredDevice) => {
      // ...check if it is already in Gladys...
      const deviceInGladys = this.gladys.stateManager.get(
        'deviceByExternalId',
        `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.id}`,
      );
      if (deviceInGladys) {
        logger.debug(`Yeelight: Device "${discoveredDevice.id}" is already in Gladys !`);
      } else {
        logger.debug(`Yeelight: Device "${discoveredDevice.id}" found, model: "${discoveredDevice.model}"`);
        unknownDevices.push(features.getDevice(this.serviceId, discoveredDevice));
      }
    });
    try {
      await this.discovery.destroy();
    } catch (error) {
      logger.warn(`Yeelight: ${error}`);
    }
    this.discoveryInProgress = false;
  } else {
    logger.debug('Yeelight: Discovery already in progress...');
  }

  return unknownDevices;
}

module.exports = {
  discover,
};
