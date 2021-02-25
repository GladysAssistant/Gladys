const logger = require('../../../../utils/logger');

const TIMEOUT = 5000;

/**
 * @description Return Philips hue bridges
 * @example
 * getBridges();
 */
async function getBridges() {
  // first, we try a fast nupnpsearch
  const bridges = await this.hueClient.discovery.nupnpSearch();
  // if we don't find any bridges, we try the other way
  if (bridges.length === 0) {
    this.bridges = await this.hueClient.discovery.upnpSearch(TIMEOUT);
  } else {
    this.bridges = bridges;
  }
  logger.info(`PhilipsHueService: Found ${this.bridges.length} bridges`);
  this.bridges.forEach((bridge) => {
    this.bridgesBySerialNumber.set(bridge.model.serial, bridge);
  });
  return this.bridges;
}

module.exports = {
  getBridges,
};
