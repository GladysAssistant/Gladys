const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const features = require('../features');
const { DEVICE_EXTERNAL_ID_BASE } = require('../utils/constants');

/**
 * @description Send a broadcast to find the devices
 * @returns {Promise<Array>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  return new Promise((resolve, reject) => {
    if (!this.discoveryInProgress) {
      logger.debug(`Yeelight: Discovery in progress...`);
      const unknownDevices = [];
      this.discoveryInProgress = true;

      if (!this.discovery || this.discovery.isDestroyed) {
        this.discovery = new this.yeelightApi.Discover();
      }

      // On device found...
      this.discovery.on('deviceAdded', (discoveredDevice) => {
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

      this.discovery.on('error', (error) => reject(error));

      this.discovery
        .scanByIp()
        .then(() => {
          this.discovery.destroy().catch((err) => logger.warn(`Yeelight: ${err}`));
          this.discoveryInProgress = false;
          resolve(unknownDevices);
        })
        .catch((error) => {
          this.discovery.destroy().catch((err) => logger.warn(`Yeelight: ${err}`));
          this.discoveryInProgress = false;
          reject(error);
        });
    } else {
      logger.debug('Yeelight: Discovery already in progress...');
      resolve([]);
    }
  })
    .timeout(10000)
    .then((discoveredDeviced) => {
      return discoveredDeviced;
    })
    .catch((error) => {
      logger.warn(`Yeelight: ${error}`);
      this.discovery.destroy().catch((err) => logger.warn(`Yeelight: ${err}`));
      this.discoveryInProgress = false;
    });
}

module.exports = {
  discover,
};
