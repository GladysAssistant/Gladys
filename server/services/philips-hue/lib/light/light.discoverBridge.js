const logger = require('../../../../utils/logger');

/**
 * @description Discover the philips hue bridge.
 * @param {string} name - Name of the Philips Hue Bridge.
 * @param {string} ipaddress - IP Address of the Philips Hue Bridge.
 * @example
 * discoverBridge('bridge1', '162.198.1.1');
 */
async function discoverBridge(name, ipaddress) {
  logger.info(`Discovering hue bridge ${ipaddress}...`);
  const { HueApi } = this.hueClient;
  const disconnectedHueApi = new HueApi();
  let userId;
  try {
    userId = await disconnectedHueApi.registerUser(ipaddress, 'Gladys');
    this.hueApi = new HueApi(ipaddress, userId);
  } catch (e) {
    throw e;
  }

  // Fetch lights information
  logger.info(`Getting lights from hue bridge ${ipaddress}...`);
  const { lights } = await this.hueApi.lights();
  return [
    {
      name,
      ipaddress,
      userId,
      lights,
    },
  ];
}

module.exports = {
  discoverBridge,
};
