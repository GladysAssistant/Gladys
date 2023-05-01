const Promise = require('bluebird');

const { unsubscribe } = require('../utils/characteristic/bluetooth.unsubscribe');

/**
 * @description Unsubscribes to peripheral characteristic.
 * @param {object} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @returns {Promise<object>} Unscription status.
 * @example
 * await subscribeDevice({ uuid: 'peripheral' }, 'service1', 'char1')
 */
async function unsubscribeDevice(peripheral, serviceUuid, characteristicUuid) {
  return this.getCharacteristic(peripheral, serviceUuid, characteristicUuid).then((characteristic) =>
    unsubscribe(characteristic),
  );
}

module.exports = {
  unsubscribeDevice,
};
