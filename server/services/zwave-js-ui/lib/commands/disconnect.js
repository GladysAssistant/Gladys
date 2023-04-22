const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave MQTT.
 * @example
 * zwave.disconnect();
 */
async function disconnect() {
  logger.debug(`ZwaveJSUI : Disconnecting...`);
  if (this.mqttClient) {
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  }

  if (this.mqttConnected) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
  } else {
    logger.debug('ZwaveJSUI: Not connected, by-pass disconnecting');
  }

  this.mqttConnected = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
