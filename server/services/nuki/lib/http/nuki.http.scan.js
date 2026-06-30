const logger = require('../../../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Scan for HTTP devices.
 * @returns {null} Return when scan started.
 * @example
 * nukiHTTPManager.scan();
 */
async function scan() {
  logger.info(`Nuki : Scan for http devices`);
  const { webOk } = await this.nukiHandler.getStatus();
  if (!webOk) {
    throw new ServiceNotConfiguredError('Unable to scan Nuki devices until Nuki Web API is configured');
  }
  try {
    const locks = await this.nukiApi.getSmartlocks();
    locks.forEach((lock) => {
      const device = this.convertToDevice(lock);
      this.discoveredDevices[device.external_id] = device;
      this.nukiHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_HTTP_DEVICE);
    });
  } catch (e) {
    logger.error(`getSmartlocks(): ${e.message}`);
  }
}

module.exports = {
  scan,
};
