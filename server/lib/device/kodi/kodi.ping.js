const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Ping kodi media center.
 * @param {Object} device - The device to ping.
 * @example
 * kodi.ping(device);
 */
async function ping(device) {
  logger.debug(`Send event kodi ping on device "${device.selector}"`);
  this.eventManager.emit(EVENTS.KODI.PING, device.id);
}

module.exports = {
  ping,
};
