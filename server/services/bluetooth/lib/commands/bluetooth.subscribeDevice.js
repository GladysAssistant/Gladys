const Promise = require('bluebird');

const { subscribe } = require('../utils/characteristic/bluetooth.subscribe');
const { read } = require('../utils/characteristic/bluetooth.read');

/**
 * @description Subscribes to peripheral characteristic.
 * @param {Object} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @param {Object} onNotify - Value callback.
 * @returns {Promise<Object>} The write value.
 * @example
 * await subscribeDevice({ uuid: 'peripheral' }, 'service1', 'char1', () => console.log('done'))
 */
async function subscribeDevice(peripheral, serviceUuid, characteristicUuid, onNotify) {
  return this.getCharacteristic(peripheral, serviceUuid, characteristicUuid).then((characteristic) =>
    subscribe(characteristic, onNotify).then(() => read(characteristic).then((value) => onNotify(value))),
  );
}

module.exports = {
  subscribeDevice,
};
