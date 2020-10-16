const { encodeValue } = require('../device/bluetooth.information');

/**
 * @description Control a remote Bluetooth device
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} Resolve when the Bluetooth message is published.
 * @example
 * setValue({ external_id: 'bluetooth:0102030405'}, { external_id: 'mqtt:0102030405:1800:2a6e'}, 1);
 */
async function setValue(device, deviceFeature, value) {
  const [, peripheralUuid, serviceUuid, characteristicUuid] = deviceFeature.external_id.split(':');

  const encodedValue = encodeValue(serviceUuid, characteristicUuid, value);
  return this.applyOnPeripheral(peripheralUuid, (peripheral) =>
    this.writeDevice(peripheral, serviceUuid, characteristicUuid, encodedValue),
  );
}

module.exports = {
  setValue,
};
