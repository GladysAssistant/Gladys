const Promise = require('bluebird');
const { NotFoundError } = require('../../../../utils/coreErrors');
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
    const hueApi = this.hueApisBySerialNumber.get(serialNumber);
    if (!hueApi) {
      throw new NotFoundError(`HUE_API_NOT_FOUND`);
    }
    logger.info(`Philips Hue: Syncing with bridge ${serialNumber}`);
    await hueApi.syncWithBridge();
  });
}

module.exports = {
  syncWithBridge,
};
