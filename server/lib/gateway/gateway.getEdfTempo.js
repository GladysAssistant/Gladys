/**
 * @description Get edf tempo.
 * @returns {Promise} Resolve data from RTE.
 * @example
 * const data = await getEdfTempo();
 */
async function getEdfTempo() {
  const systemInfos = await this.system.getInfos();
  return this.gladysGatewayClient.getEdfTempo(systemInfos.gladys_version);
}

module.exports = {
  getEdfTempo,
};
