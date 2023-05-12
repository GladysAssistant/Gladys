const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Disconnect sunspec MQTT.
 * @example
 * sunspec.disconnect();
 */
async function disconnect() {
  logger.debug(`SunSpecJSUI : Disconnecting...`);
  if (this.modbusClient) {
    this.modbusClient.close(() => {
      if (this.sunspecConnected) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
        });
      } else {
        logger.debug('SunSpecJSUI: Not connected, by-pass disconnecting');
      }
      this.sunspecConnected = false;
      this.scanInProgress = false;
    });
  }
}

module.exports = {
  disconnect,
};
