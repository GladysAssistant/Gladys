const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const features = require('../features');
const { EWELINK_REGION_KEY } = require('../utils/constants');
const { getExternalId } = require('../utils/externalId');

/**
 * @description Retrieve eWelink devices from cloud.
 * @returns {Promise<Array<object>>} Resolve with array of new devices.
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
        // ...if it is already in Gladys...
        const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', getExternalId(discoveredDevice));
        if (deviceInGladys) {
          logger.debug(`eWeLink: Device "${discoveredDevice.deviceid}" is already in Gladys !`);
        } else {
          const channels = await connection.getDeviceChannelCount(discoveredDevice.deviceid);
          logger.debug(`eWeLink: Get device channel count "${discoveredDevice.deviceid}": ${JSON.stringify(channels)}`);

          logger.debug(
            `eWeLink: Device "${discoveredDevice.deviceid}" found, uiid: ${discoveredDevice.uiid}, model: "${discoveredDevice.productModel}, switches: ${channels.switchesAmount}`,
          );
          unknownDevices.push(features.getDevice(this.serviceId, discoveredDevice, channels.switchesAmount));
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
