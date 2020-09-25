/**
 * @description Prepares service and starts connection with broker.
 * @returns {boolean} Status of Zigbee2mqtt Permit join.
 * @example
 * init();
 */
async function getPermitJoin() {
  return this.z2mPermitJoin;
}

module.exports = {
  getPermitJoin,
};
