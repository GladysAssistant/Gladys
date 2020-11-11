const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { DEVICE_EXTERNAL_ID_BASE, EWELINK_REGION_KEY } = require('../utils/constants');
const models = require('../models');

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
  await this.throwErrorIfNeeded(discoveredDevices, true);

  const unknownDevices = [];

  // If devices are found...
  logger.info(`eWeLink: ${discoveredDevices.length} device(s) found while retrieving from the cloud !`);
  if (discoveredDevices.length) {
    // ...check, for each of them, ...
    await Promise.map(discoveredDevices, async (discoveredDevice) => {
      const uiid = discoveredDevice.uiid.toString();
      if (Object.keys(models).includes(uiid)) {
        // ...if the model is supported, ...
        const channels = await connection.getDeviceChannelCount(discoveredDevice.deviceid);
        await this.throwErrorIfNeeded(channels, true);

        // ...for each channel of the device...
        for (let channel = 1; channel <= channels.switchesAmount; channel += 1) {
          let deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.deviceid}:${channel}`;
          if (channels.switchesAmount === 1) {
            deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.deviceid}:0`;
          }

          // ...if it is already in Gladys...
          const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
          if (deviceInGladys) {
            logger.debug(`eWeLink: Device "${discoveredDevice.deviceid}" is already in Gladys !`);
          } else {
            logger.debug(
              `eWeLink: Device "${discoveredDevice.deviceid}" found, uiid: ${uiid}, model: "${discoveredDevice.productModel}", channel: ${channel}/${channels.switchesAmount}"`,
            );
            if (channels.switchesAmount === 1) {
              unknownDevices.push(models[uiid].getDevice(this.serviceId, discoveredDevice));
            } else {
              unknownDevices.push(models[uiid].getDevice(this.serviceId, discoveredDevice, channel));
            }
          }
        }
      } else {
        // ...else the device is not yet handled.
        logger.info(`eWeLink: Device model "${discoveredDevice.model}" not handled yet !`);
        unknownDevices.push(models.unhandled.getDevice(this.serviceId, discoveredDevice));
      }
    });
  }
  return unknownDevices;
}

module.exports = {
  discover,
};
