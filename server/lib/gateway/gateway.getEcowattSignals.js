/**
 * @description Get ecowatt signals.
 * @returns {Promise} Resolve data from ecowatt.
 * @example
 * const data = await getEcowattSignals();
 */
async function getEcowattSignals() {
  const systemInfos = await this.system.getInfos();
  return this.gladysGatewayClient.getEcowattSignals(systemInfos.gladys_version);
}

module.exports = {
  getEcowattSignals,
};
