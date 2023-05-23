const Promise = require('bluebird');

const { subscribe } = require('../utils/characteristic/bluetooth.subscribe');
const { read } = require('../utils/characteristic/bluetooth.read');

/**
 * @description Subscribes to peripheral characteristic.
 * @param {object} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @param {object} onNotify - Value callback.
 * @returns {Promise<object>} The write value.
 * @example
 * await subscribeDevice({ uuid: 'peripheral' }, 'service1', 'char1', () => console.log('done'))
 */
async function subscribeDevice(peripheral, serviceUuid, characteristicUuid, onNotify) {
  const characteristic = await this.getCharacteristic(peripheral, serviceUuid, characteristicUuid);
  await subscribe(characteristic, onNotify);
  const value = await read(characteristic);
  await onNotify(value);
  return value;
}

module.exports = {
  subscribeDevice,
};
