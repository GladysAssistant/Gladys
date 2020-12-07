const { write } = require('../utils/characteristic/bluetooth.write');

/**
 * @description Write specific value to requested characteristic.
 * @param {string} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @param {Array | Buffer} value - Value to send to peripheral.
 * @param {boolean} withoutResponse - Use "write without response" property (default false).
 * @returns {Promise<Object>} The write value.
 * @example
 * await writeDevice({ uuid: 'peripheral' }, 'service1', 'char1')
 */
async function writeDevice(peripheral, serviceUuid, characteristicUuid, value, withoutResponse = false) {
  return this.getCharacteristic(peripheral, serviceUuid, characteristicUuid).then((characteristic) =>
    write(characteristic, value, withoutResponse),
  );
}

module.exports = {
  writeDevice,
};
