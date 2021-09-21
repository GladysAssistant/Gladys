/**
 * @description Get permit_join state from Gladys.
 * @returns {boolean} Status of Zigbee2mqtt Permit join.
 * @example
 * init();
 */
function getPermitJoin() {
  return this.z2mPermitJoin;
}

module.exports = {
  getPermitJoin,
};
