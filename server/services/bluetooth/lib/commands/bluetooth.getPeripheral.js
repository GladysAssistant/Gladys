/**
 * @description Return asked raw Peripheral, or undefined, from Bluetooth library.
 * @param {string} uuid - Wanted peripheral UUID.
 * @returns {object} Returns peripheral according to this UUID.
 * @example
 * const peripheral = bluetoothManager.getPeripheral('99dd77cba4');
 */
function getPeripheral(uuid) {
  // eslint-disable-next-line no-underscore-dangle
  return this.bluetooth._peripherals[uuid];
}

module.exports = {
  getPeripheral,
};
