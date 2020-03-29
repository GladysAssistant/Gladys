const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const models = require('../models');
const { DEVICE_EXTERNAL_ID_BASE } = require('../utils/constants');

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

  const connection = new this.EweLinkApi({ at: this.accessToken, region: this.region });
  const discoveredDevices = await connection.getDevices();
  if (discoveredDevices.error) {
    throw new Error(`EWeLink getDevices error: ${discoveredDevices.msg}`);
  }

  const unknownDevices = [];

  // If devices are found...
  logger.info(`${discoveredDevices.length || 0} device(s) found while retrieving from the cloud !`);
  if (discoveredDevices.length) {
    // TODO to use i18n (exp: ${i18n[systemLanguage].device.binarySuffix})
    // const systemLanguage = this.gladys.stateManager.get('system', 'SYSTEM_LANGUAGE') || 'en';

    // ...check, for each of them, ...
    await Promise.map(discoveredDevices, async (discoveredDevice) => {
      const uiid = discoveredDevice.uiid.toString();
      if (Object.keys(models).includes(uiid)) {
        // ...if the model is supported, ...
        const channels = await connection.getDeviceChannelCount(discoveredDevice.deviceid);
        if (channels.error) {
          throw new Error(`EWeLink getDeviceChannelCount error: ${channels.msg}`);
        }

        // ...for each channel of the device...
        for (let channel = 1; channel <= channels.switchesAmount; channel += 1) {
          let deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.deviceid}:${channel}`;
          if (channels.switchesAmount === 1) {
            deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.deviceid}:0`;
          }

          // ...if it is already in Gladys...
          const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
          if (deviceInGladys) {
            logger.debug(`Device "${discoveredDevice.deviceid}" is already in Gladys !`);
          } else {
            logger.debug(
              `Device "${discoveredDevice.deviceid}" found, uiid: ${uiid}, model: "${discoveredDevice.productModel}", channel: ${channel}/${channels.switchesAmount}"`,
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
        logger.info(`Device model "${discoveredDevice.model}" not handled yet !`);
        unknownDevices.push(models.unhandled.getDevice(this.serviceId, discoveredDevice));
      }
    });
  }
  return unknownDevices;
}

module.exports = {
  discover,
};
