const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Re-sync with a specific bridge.
 * @param {string} bridgeSerialNumber - Serial number of the bridge to sync.
 * @returns {Promise} Resolve when sync is finished.
 * @example
 * syncBridgeBySerialNumber('001788FFFE000000');
 */
async function syncBridgeBySerialNumber(bridgeSerialNumber) {
  const hueApi = this.hueApisBySerialNumber.get(bridgeSerialNumber);
  if (!hueApi) {
    throw new NotFoundError(`HUE_API_NOT_FOUND`);
  }
  logger.info(`Philips Hue: Syncing with bridge ${bridgeSerialNumber}`);
  await hueApi.syncWithBridge();
}

module.exports = {
  syncBridgeBySerialNumber,
};
