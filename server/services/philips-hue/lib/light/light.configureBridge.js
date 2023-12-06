const logger = require('../../../../utils/logger');
const { Error403 } = require('../../../../utils/httpErrors');
const {
  HUE_DEVICE_NAME,
  HUE_APP_NAME,
  BRIDGE_EXTERNAL_ID_BASE,
  BRIDGE_MODEL,
  BRIDGE_IP_ADDRESS,
  BRIDGE_USERNAME,
  BRIDGE_SERIAL_NUMBER,
} = require('../utils/consts');

/**
 * @description Configure the philips hue bridge.
 * @param {string} ipAddress - IP Address of the Philips Hue Bridge.
 * @returns {Promise<object>} Resolve with created device.
 * @example
 * configureBridge('162.198.1.1');
 */
async function configureBridge(ipAddress) {
  const bridge = this.bridgesByIP.get(ipAddress);
  if (!bridge) {
    logger.info(`Connecting to hue bridge ip = ${ipAddress} manually (not from discovered bridges)...`);
  } else {
    logger.info(`Connecting to hue bridge "${bridge.name}", ip = ${ipAddress} (from discovered bridges)...`);
  }
  try {
    const hueApi = this.hueClient.api;
    const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
    const user = await unauthenticatedApi.users.createUser(HUE_APP_NAME, HUE_DEVICE_NAME);
    const authenticatedApi = await hueApi.createLocal(ipAddress).connect(user.username);
    // Get configuration to fetch serialNumber
    const bridgeConfig = await authenticatedApi.configuration.get();
    const bridgeSerialNumber = bridgeConfig.bridgeid;
    const bridgeName = bridge ? bridge.name : bridgeConfig.name;
    this.hueApisBySerialNumber.set(bridgeSerialNumber, authenticatedApi);
    const deviceCreated = await this.gladys.device.create({
      name: bridgeName,
      service_id: this.serviceId,
      external_id: `${BRIDGE_EXTERNAL_ID_BASE}:${bridgeSerialNumber}`,
      selector: `${BRIDGE_EXTERNAL_ID_BASE}:${bridgeSerialNumber}`,
      model: BRIDGE_MODEL,
      features: [],
      params: [
        {
          name: BRIDGE_IP_ADDRESS,
          value: ipAddress,
        },
        {
          name: BRIDGE_USERNAME,
          value: user.username,
        },
        {
          name: BRIDGE_SERIAL_NUMBER,
          value: bridgeSerialNumber,
        },
      ],
    });
    // if bridge is not already in array, we push it
    const bridgeInArray = this.connnectedBridges.find((b) => b.external_id === deviceCreated.external_id);
    if (!bridgeInArray) {
      this.connnectedBridges.push(deviceCreated);
    }
    return deviceCreated;
  } catch (e) {
    if (e.getHueErrorType && e.getHueErrorType() === 101) {
      throw new Error403('BRIDGE_BUTTON_NOT_PRESSED');
    } else {
      throw e;
    }
  }
}

module.exports = {
  configureBridge,
};
