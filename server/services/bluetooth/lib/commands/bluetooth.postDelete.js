const Promise = require('bluebird');

const logger = require('../../../../utils/logger');

/**
 * @description Unsubscribe to peripheral notification on device delete.
 * @param {Object} device - Newly created Gladys device.
 * @returns {Promise} All subscription promises.
 * @example
 * await bluetooth.postDelete(device);
 */
async function postDelete(device) {
  const [, peripheralUuid] = device.external_id.split(':');

  const unsubscribe = (peripheral) => {
    return Promise.map(
      device.features,
      (feature) => {
        const [, , serviceUuid, characteristicUuid] = feature.external_id.split(':');
        return this.unsubscribeDevice(peripheral, serviceUuid, characteristicUuid);
      },
      { concurrency: 1 },
    ).catch((e) => {
      logger.error(e.message);
      return Promise.resolve();
    });
  };

  return this.applyOnPeripheral(peripheralUuid, unsubscribe, true).catch((e) => {
    logger.error(e.message);
    return Promise.resolve();
  });
}

module.exports = {
  postDelete,
};
