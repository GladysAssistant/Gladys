const logger = require('../../../../utils/logger');
const { BadParameters } = require('../../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Scan for HTTP devices.
 * @returns {null} Return when scan started.
 * @example
 * nukiHTTPManager.scan();
 */
async function scan() {
  logger.info(`Nuki : Scan for http devices`);
  try {
    const locks = await this.nukiApi.getSmartlocks();
    locks.forEach( (lock) => {
      const device = this.convertToDevice(lock);
      this.discoveredDevices[device.external_id] = device;
      logger.trace(device);
      this.nukiHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_HTTP_DEVICE);
    });
  } catch (e) {
    logger.error('getSmartlocks(): ' + e.message);
  }
}

module.exports = {
  scan,
};
