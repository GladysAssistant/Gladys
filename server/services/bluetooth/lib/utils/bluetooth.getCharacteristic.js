const Promise = require('bluebird');

const { discoverServices } = require('./peripheral/bluetooth.discoverServices');
const { discoverCharacteristics } = require('./service/bluetooth.discoverCharacteristics');

/**
 * @description Connects to peripheral, discovers all needed, to applu action.
 * @param {string} connectedPeripheral - Connected Noble peripheral.
 * @param {string} serviceUuid - Service UUID.
 * @param {string} characteristicUuid - Characteristic UUID.
 * @returns {Promise<Object>} The requs=est  characteristic.
 * @example
 * await getCharacteristic({ uuid: 'peripheral' }, 'service1', 'char1')
 */
async function getCharacteristic(connectedPeripheral, serviceUuid, characteristicUuid) {
  // Discovering service
  const services = await discoverServices(connectedPeripheral, [serviceUuid]);

  // Discorvering characteristic
  const characteristics = await discoverCharacteristics(services[serviceUuid], [characteristicUuid]);
  return characteristics[characteristicUuid];
}

module.exports = {
  getCharacteristic,
};
