const logger = require('../../../../utils/logger');

const EXTERNAL_ID_BASE = 'philips-hue:bridge';

/**
 * @description Configure the philips hue bridge.
 * @param {string} name - Name of the bridge.
 * @param {string} ipAddress - IP Address of the Philips Hue Bridge.
 * @example
 * configureBridge('162.198.1.1');
 */
async function configureBridge(name, ipAddress) {
  logger.info(`Connecting to hue bridge ${name} at ${ipAddress}...`);
  const { HueApi } = this.hueClient;
  const disconnectedHueApi = new HueApi();
  const userId = await disconnectedHueApi.registerUser(ipAddress, 'Gladys');
  this.hueApi = new HueApi(ipAddress, userId);
  return this.gladys.device.create({
    name,
    service_id: this.serviceId,
    external_id: `${EXTERNAL_ID_BASE}:${ipAddress}:${userId}`,
    features: [],
    params: [
      {
        name: 'BRIDGE_IP_ADDRESS',
        value: ipAddress,
      },
      {
        name: 'BRIDGE_USER_ID',
        value: userId,
      },
    ],
  });
}

module.exports = {
  configureBridge,
};
