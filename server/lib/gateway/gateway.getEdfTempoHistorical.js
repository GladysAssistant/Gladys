/**
 * @description Get edf tempo historical data.
 * @param {string} start - Start date.
 * @param {number} take - Number of data to take.
 * @returns {Promise} Resolve data.
 * @example
 * const data = await getEdfTempoHistorical('2025-01-01', 10);
 */
async function getEdfTempoHistorical(start, take) {
  const systemInfos = await this.system.getInfos();
  return this.gladysGatewayClient.getEdfTempoHistorical(systemInfos.gladys_version, start, take);
}

module.exports = {
  getEdfTempoHistorical,
};
