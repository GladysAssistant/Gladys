const logger = require('../../../../utils/logger');

const TIMEOUT = 5000;

/**
 * @description Return Philips hue bridges
 * @example
 * getBridges();
 */
async function getBridges() {
  this.bridges = await this.hueClient.discovery.upnpSearch(TIMEOUT);
  logger.info(`PhilipsHueService: Found ${this.bridges.length} bridges`);
  this.bridges.forEach((bridge) => {
    this.bridgesBySerialNumber.set(bridge.model.serial, bridge);
  });
  return this.bridges;
}

module.exports = {
  getBridges,
};
