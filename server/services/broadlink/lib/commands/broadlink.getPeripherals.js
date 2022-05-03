/**
 * @description Returns stored peripherals.
 * @returns {Promise} Discovered peripherals.
 * @example
 * await gladys.broadlink.getPeripherals();
 */
async function getPeripherals() {
  await this.init();
  return Object.values(this.peripherals);
}

module.exports = {
  getPeripherals,
};
