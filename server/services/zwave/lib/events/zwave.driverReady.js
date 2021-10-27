const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description When the driver is ready.
 * @param {string} homeId - The homeId.
 * @example
 * zwave.on('driver ready', this.driverReady);
 */
function driverReady(homeId) {
  logger.debug(`Zwave : Driver is ready. homeId = ${homeId}`);
  this.scanInProgress = true;
  this.ready = true;
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.DRIVER_READY,
    payload: {},
  });
}

module.exports = {
  driverReady,
};
