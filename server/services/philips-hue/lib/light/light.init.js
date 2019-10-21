const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { getDeviceParam } = require('../../../../utils/device');
const { BRIDGE_MODEL, BRIDGE_IP_ADDRESS, BRIDGE_USERNAME, BRIDGE_SERIAL_NUMBER } = require('../utils/consts');
/**
 * @description Init Philips Hue service.
 * @example
 * init();
 */
async function init() {
  // first we connect to all philips-hue bridges
  const devices = await this.gladys.device.get({
    service: 'philips-hue',
    model: BRIDGE_MODEL,
  });
  const hueApi = this.hueClient.api;
  await Promise.map(devices, async (device) => {
    const ipAddress = getDeviceParam(device, BRIDGE_IP_ADDRESS);
    const username = getDeviceParam(device, BRIDGE_USERNAME);
    const serialNumber = getDeviceParam(device, BRIDGE_SERIAL_NUMBER);
    if (ipAddress && username && serialNumber) {
      try {
        const authenticatedApi = await hueApi.createLocal(ipAddress).connect(username);
        this.hueApisBySerialNumber.set(serialNumber, authenticatedApi);
        logger.debug(`Connected to Philips hue bridge "${device.name}"`);
        this.connnectedBridges.push(device);
      } catch (e) {
        logger.warn(`Unable to connect to Philips Hue bridge "${device.name}"`);
        logger.debug(e);
      }
    }
  });
}

module.exports = {
  init,
};
