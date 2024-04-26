const logger = require('../../../../utils/logger');

const TIMEOUT = 10000;

/**
 * @description Return Philips hue bridges.
 * @returns {Promise<Array>} Resolve with list of bridges.
 * @example
 * getBridges();
 */
async function getBridges() {
  // Launch faster N-UPnP Search
  this.bridges = await this.hueClient.discovery.nupnpSearch();
  logger.info(`PhilipsHueService: Found ${this.bridges.length} bridges with N-UPnP Search`);

  // Fallback on UPnP Search
  if (this.bridges.length === 0) {
    this.bridges = await this.hueClient.discovery.upnpSearch(TIMEOUT);
    logger.info(`PhilipsHueService: Found ${this.bridges.length} bridges with UPnP Search`);
  }

  this.bridges.forEach((bridge) => {
    this.bridgesByIP.set(bridge.ipaddress, bridge);
  });
  return this.bridges;
}

module.exports = {
  getBridges,
};
