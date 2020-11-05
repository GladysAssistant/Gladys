const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { decodeValue } = require('../device/bluetooth.information');

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

            const onNotify = (value) => {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: feature.external_id,
                state: decodeValue(serviceUuid, characteristicUuid, feature, value),
              });
            };

            return this.subscribeDevice(peripheral, serviceUuid, characteristicUuid, onNotify);
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
