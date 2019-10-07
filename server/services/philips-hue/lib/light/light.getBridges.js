const logger = require('../../../../utils/logger');

/**
 * @description Return Philips hue bridges
 * @example
 * getBridges();
 */
async function getBridges() {
  this.bridges = await this.hueClient.discovery.nupnpSearch();
  logger.info(`PhilipsHueService: Found ${this.bridges.length} bridges`);
  this.bridges.forEach((bridge) => {
    this.bridgesBySerialNumber.set(bridge.model.serial, bridge);
  });
  return this.bridges;
}

module.exports = {
  getBridges,
};
