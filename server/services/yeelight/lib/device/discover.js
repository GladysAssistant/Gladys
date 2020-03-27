const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const models = require('../models');
const { DEVICE_EXTERNAL_ID_BASE, DEVICES_MODELS, COMMAND_TYPE } = require('../utils/constants');

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
      const discoveredDeviced = [];
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

          let model;
          if (Object.keys(DEVICES_MODELS).includes(discoveredDevice.model)) {
            // ...else, if the model is supported...
            if (
              discoveredDevice.capabilities.includes(COMMAND_TYPE.SET_RGB) &&
              discoveredDevice.capabilities.includes(COMMAND_TYPE.SET_HSV)
            ) {
              // ...and has color ability, create a color light device...
              model = models.color;
            } else {
              // ...else, create a white light device...
              model = models.white;
            }
          } else {
            // ...else the device is not yet handled.
            logger.debug(`Yeelight: Device model "${discoveredDevice.model}" not handled yet !`);
            model = models.unhandled;
          }
          discoveredDeviced.push(model.getDevice(discoveredDevice, this.serviceId));
        }
      });

      this.discovery.once('error', (error) => reject(error));

      this.discovery
        .start()
        .then(() => {
          this.discovery.destroy().catch((err) => logger.warn(`Yeelight: ${err}`));
          this.discoveryInProgress = false;
          resolve(discoveredDeviced);
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
