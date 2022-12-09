/**
 * @description Get ecowatt signals
 * @returns {Promise} Resolve data from ecowatt.
 * @example
 * const data = await getEcowattSignals();
 */
async function getEcowattSignals() {
  return this.gladysGatewayClient.getEcowattSignals();
}

module.exports = {
  getEcowattSignals,
};
