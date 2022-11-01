const logger = require('../../../utils/logger');

/**
 * @description Send MQTT message to request backup.
 * @example
 * await z2m.requestZ2mBackup();
 */
function requestZ2mBackup() {
  logger.debug('Zigbee2MQTT request for backup');
  this.mqttClient.publish('zigbee2mqtt/bridge/request/backup');
}

module.exports = {
  requestZ2mBackup,
};
