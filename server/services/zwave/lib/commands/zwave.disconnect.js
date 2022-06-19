const logger = require('../../../../utils/logger');

/**
 * @description Disconnect zwave usb driver.
 * @example
 * zwave.disconnectZwaveJS();
 */
async function disconnectZwaveJS() {
  if (this.connected) {
    logger.debug(`Zwave : Disconnecting...`);
    await this.driver.destroy();
  } else {
    logger.debug('Zwave: Not connected, disconnecting');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;

  this.updateConfigJob.cancel();
}

/**
 * @description Disconnect zwave MQTT.
 * @example
 * zwave.disconnectZwave2mqtt();
 */
async function disconnectZwave2mqtt() {
  if (this.connected) {
    logger.debug(`Zwave : Disconnecting...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Zwave: Not connected, disconnecting');
  }
  this.connected = false;
  this.ready = false;
  this.scanInProgress = false;
}

module.exports = {
  disconnectZwaveJS,
  disconnectZwave2mqtt,
};
