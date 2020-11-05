const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { decodeValue } = require('../device/bluetooth.information');

/**
 * @description Subscribe to peripheral notification on device creation.
 * @param {Object} device - Newly created Gladys device.
 * @returns {Promise} All subscription promises.
 * @example
 * await bluetooth.postCreate(device);
 */
async function postCreate(device) {
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
}

module.exports = {
  postCreate,
};
