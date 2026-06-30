const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

const { getDeviceParam } = require('../../../../utils/device');

const { BRIDGE_SERIAL_NUMBER } = require('../utils/consts');

/**
 * @description Re-sync with bridge.
 * @returns {Promise} Resolve when sync is finished.
 * @example
 * syncWithBridge();
 */
async function syncWithBridge() {
  logger.info(`Philips Hue: syncWithBridge`);
  await Promise.map(this.connnectedBridges, async (device) => {
    const serialNumber = getDeviceParam(device, BRIDGE_SERIAL_NUMBER);
    await this.syncBridgeBySerialNumber(serialNumber);
  });
}

module.exports = {
  syncWithBridge,
};
