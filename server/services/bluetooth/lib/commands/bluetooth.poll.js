const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

const { decodeValue } = require('../device/bluetooth.information');
const { read } = require('../utils/characteristic/bluetooth.read');

/**
 * @description Poll value of a Bluetooth device
 * @param {Object} device - The device to control.
 * @returns {Promise} Promise of all read values.
 * @example
 * await bluetooth.poll({ external_id: 'bluetooth:uuid'});
 */
async function poll(device) {
  const [, peripheralUuid] = device.external_id.split(':');

  const readFeature = (feature, peripheral) => {
    const featureExternalId = feature.external_id;
    const [, , serviceUuid, characteristicUuid] = featureExternalId.split(':');

    return this.getCharacteristic(peripheral, serviceUuid, characteristicUuid)
      .then((characteristic) => read(characteristic))
      .then((value) => {
        const state = decodeValue(serviceUuid, characteristicUuid, feature, value);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: featureExternalId,
          state,
        });
        return state;
      })
      .catch((e) => {
        logger.warn(e.message);
        return Promise.resolve();
      });
  };

  const readFeatures = (peripheral) => {
    return Promise.map(device.features, (feature) => readFeature(feature, peripheral), { concurrency: 1 });
  };

  return this.applyOnPeripheral(peripheralUuid, readFeatures);
}

module.exports = {
  poll,
};
