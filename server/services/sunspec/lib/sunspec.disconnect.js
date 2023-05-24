const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Disconnect sunspec MQTT.
 * @example
 * sunspec.disconnect();
 */
async function disconnect() {
  logger.debug(`SunSpec: Disconnecting...`);

  clearInterval(this.scanDevicesInterval);

  if (this.modbusClient) {
    this.modbusClient.close(() => {
      if (this.connected) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
        });
      } else {
        logger.debug('SunSpec: Not connected, by-pass disconnecting');
      }
    });
  }

  this.connected = false;
}

module.exports = {
  disconnect,
};
