const Promise = require('bluebird');

const logger = require('../../../../utils/logger');

/**
 * @description Look for Gladys Bluetooth devices and subscribe to notifications.
 * @returns {Promise} All subscription promises.
 * @example
 * await bluetooth.connectDevices();
 */
async function connectDevices() {
  logger.debug(`Bluetooth: subscribing to existing devices...`);
  const devices = await this.gladys.device.get({
    service_id: this.serviceId,
  });

  return Promise.map(devices, (device) => this.postCreate(device), { concurrency: 1 });
}

module.exports = {
  connectDevices,
};
