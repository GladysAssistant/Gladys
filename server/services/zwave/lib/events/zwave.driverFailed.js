const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the driver failed to start.
 * @example
 * zwave.on('driver failed', this.driverFailed);
 */
function driverFailed() {
  logger.debug(`Zwave : Failed to start driver.`);
  this.connected = false;
  this.ready = false;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_FAILED,
    payload: {},
  });
}

module.exports = {
  driverFailed,
};
