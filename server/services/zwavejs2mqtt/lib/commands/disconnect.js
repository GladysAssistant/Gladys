const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave MQTT.
 * @example
 * zwave.disconnect();
 */
async function disconnect() {
  if (this.mqttConnected) {
    logger.debug(`Zwavejs2mqtt : Disconnecting...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
    });
  } else {
    logger.debug('Zwavejs2mqtt: Not connected, by-pass disconnecting');
  }

  this.mqttConnected = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnect,
};
