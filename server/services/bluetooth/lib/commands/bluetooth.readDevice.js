const { read } = require('../utils/characteristic/bluetooth.read');

/**
 * @description Read value of a Bluetooth device
 * @param {string} peripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @returns {Promise} Promise of all read values.
 * @example
 * await bluetooth.readDevice({ external_id: 'bluetooth:uuid'});
 */
async function readDevice(peripheral, serviceUuid, characteristicUuid) {
  return this.getCharacteristic(peripheral, serviceUuid, characteristicUuid).then((characteristic) =>
    read(characteristic),
  );
}

module.exports = {
  readDevice,
};
