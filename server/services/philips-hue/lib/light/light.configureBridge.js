const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
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
 * @param {string} serialNumber - Serial number of the Philips Hue Bridge.
 * @example
 * configureBridge('162.198.1.1');
 */
async function configureBridge(serialNumber) {
  const bridge = this.bridgesBySerialNumber.get(serialNumber);
  if (!bridge) {
    throw new NotFoundError(`BRIDGE_NOT_FOUND`);
  }
  logger.info(`Connecting to hue bridge "${serialNumber}", ip = ${bridge.ipaddress}...`);
  try {
    const hueApi = this.hueClient.api;
    const unauthenticatedApi = await hueApi.createLocal(bridge.ipaddress).connect();
    const user = await unauthenticatedApi.users.createUser(HUE_APP_NAME, HUE_DEVICE_NAME);
    const authenticatedApi = await hueApi.createLocal(bridge.ipaddress).connect(user.username);
    this.hueApisBySerialNumber.set(serialNumber, authenticatedApi);
    const deviceCreated = await this.gladys.device.create({
      name: bridge.name,
      service_id: this.serviceId,
      external_id: `${BRIDGE_EXTERNAL_ID_BASE}:${serialNumber}`,
      selector: `${BRIDGE_EXTERNAL_ID_BASE}:${serialNumber}`,
      model: BRIDGE_MODEL,
      features: [],
      params: [
        {
          name: BRIDGE_IP_ADDRESS,
          value: bridge.ipaddress,
        },
        {
          name: BRIDGE_USERNAME,
          value: user.username,
        },
        {
          name: BRIDGE_SERIAL_NUMBER,
          value: serialNumber,
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
