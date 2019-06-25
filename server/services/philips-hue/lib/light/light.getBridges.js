const logger = require('../../../../utils/logger');

/**
 * @description Return Philips hue bridges
 * @example
 * getBridges();
 */
async function getBridges() {
  const bridges = await this.hueClient.nupnpSearch();
  logger.info(`PhilipsHueService: Found ${bridges.length} bridges`);
  return bridges;
}

module.exports = {
  getBridges,
};
