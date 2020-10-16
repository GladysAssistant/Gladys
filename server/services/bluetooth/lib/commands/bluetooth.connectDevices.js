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

  return Promise.map(
    devices,
    (device) => {
      const [, peripheralUuid] = device.external_id.split(':');

      const subscribe = (peripheral) => {
        return Promise.map(
          device.features,
          (feature) => {
            const [, , serviceUuid, characteristicUuid] = feature.external_id.split(':');
            return this.subscribePeripheral(peripheral, serviceUuid, characteristicUuid, feature);
          },
          { concurrency: 1 },
        ).catch((e) => {
          logger.error(e.message);
          return Promise.resolve();
        });
      };

      return this.applyOnPeripheral(peripheralUuid, subscribe, true).catch((e) => {
        logger.error(e.message);
        return Promise.resolve();
      });
    },
    { concurrency: 1 },
  );
}

module.exports = {
  connectDevices,
};
