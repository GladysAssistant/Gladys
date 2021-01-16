const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const features = require('../features');
const { EWELINK_REGION_KEY } = require('../utils/constants');

/**
 * @description Retrieve eWelink devices from cloud.
 * @returns {Promise<Array<Object>>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  if (!this.connected) {
    await this.connect();
  }

  const region = await this.gladys.variable.getValue(EWELINK_REGION_KEY, this.serviceId);
  const connection = new this.EweLinkApi({ at: this.accessToken, region });
  const discoveredDevices = await connection.getDevices();
  logger.debug(`eWeLink: Get devices: ${JSON.stringify(discoveredDevices)}`);
  await this.throwErrorIfNeeded(discoveredDevices, true);

  const unknownDevices = [];

  // If devices are found...
  logger.info(`eWeLink: ${discoveredDevices.length} device(s) found while retrieving from the cloud !`);
  if (discoveredDevices.length) {
    // ...check, for each of them, ...
    await Promise.map(
      discoveredDevices,
      async (discoveredDevice) => {
        const channels = await connection.getDeviceChannelCount(discoveredDevice.deviceid);
        logger.debug(`eWeLink: Get device channel count "${discoveredDevice.deviceid}": ${JSON.stringify(channels)}`);

        if (channels.switchesAmount > 1) {
          // ...for each channel of the device...
          for (let channel = 1; channel <= channels.switchesAmount; channel += 1) {
            // ...if it is already in Gladys...
            const deviceInGladys = this.gladys.stateManager.get(
              'deviceByExternalId',
              features.getExternalId(discoveredDevice, channel),
            );
            if (deviceInGladys) {
              logger.debug(`eWeLink: Device "${discoveredDevice.deviceid}" is already in Gladys !`);
            } else {
              logger.debug(
                `eWeLink: Device "${discoveredDevice.deviceid}" found, uiid: ${discoveredDevice.uiid}, model: "${discoveredDevice.productModel}, channel: ${channel}/${channels.switchesAmount}`,
              );
              unknownDevices.push(features.getDevice(this.serviceId, discoveredDevice, channel));
            }
          }
        } else {
          // ...if it is already in Gladys...
          const deviceInGladys = this.gladys.stateManager.get(
            'deviceByExternalId',
            features.getExternalId(discoveredDevice),
          );
          if (deviceInGladys) {
            logger.debug(`eWeLink: Device "${discoveredDevice.deviceid}" is already in Gladys !`);
          } else {
            logger.debug(
              `eWeLink: Device "${discoveredDevice.deviceid}" found, uiid: ${discoveredDevice.uiid}, model: "${discoveredDevice.productModel}`,
            );
            unknownDevices.push(features.getDevice(this.serviceId, discoveredDevice));
          }
        }
      },
      { concurrency: 1 },
    );
  }
  return unknownDevices;
}

module.exports = {
  discover,
};
