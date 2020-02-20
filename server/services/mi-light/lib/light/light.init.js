const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

const { getDeviceParam } = require('../../../../utils/device');
const { BRIDGE_MODEL, BRIDGE_IP_ADDRESS, BRIDGE_MAC, BRIDGE_TYPE, BRIDGE_NAME } = require('../utils/consts');
/**
 * @description Init Mi light service.
 * @example
 * init();
 */
async function init() {
  // first we connect to all mi light bridges
  const devices = await this.gladys.device.get({
    service: 'mi-light',
    model: BRIDGE_MODEL,
  });
  await Promise.map(devices, async (device) => {
    const ip = getDeviceParam(device, BRIDGE_IP_ADDRESS);
    const mac = getDeviceParam(device, BRIDGE_MAC);
    const type = getDeviceParam(device, BRIDGE_TYPE);
    const name = getDeviceParam(device, BRIDGE_NAME);

    const arrayOfparam = { ip, mac, name, type };

    if (ip && mac) {
      this.connectedBridges.push(device);
      this.bridgesByMac.set(mac, arrayOfparam);
      logger.debug(`Connected to mi-light bridge "${device.name}"`);
    }
  });
}

module.exports = {
  init,
};
