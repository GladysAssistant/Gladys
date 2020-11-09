const Promise = require('bluebird');

const { write } = require('../utils/characteristic/bluetooth.write');
const { getCharacteristic } = require('../utils/bluetooth.getCharacteristic');

/**
 * @description Write specific value to requested characteristic.
 * @param {string} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @param {Array | Buffer} value - Value to send to peripheral.
 * @returns {Promise<Object>} The write value.
 * @example
 * await writeDevice({ uuid: 'peripheral' }, 'service1', 'char1')
 */
async function writeDevice(peripheral, serviceUuid, characteristicUuid, value) {
  return getCharacteristic(peripheral, serviceUuid, characteristicUuid).then((characteristic) =>
    write(characteristic, value),
  );
}

module.exports = {
  writeDevice,
};
