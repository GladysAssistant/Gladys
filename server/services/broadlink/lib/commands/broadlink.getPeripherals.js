/**
 * @description Returns stored peripherals.
 * @returns {Array} Discovered peripherals.
 * @example
 * gladys.broadlink.getPeripherals();
 */
function getPeripherals() {
  return Object.values(this.peripherals);
}

module.exports = {
  getPeripherals,
};
