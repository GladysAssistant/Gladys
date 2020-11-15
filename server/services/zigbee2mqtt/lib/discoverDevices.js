const logger = require('../../../utils/logger');

/**
 * @description Publish message on discover topic.
 * @example
 * discoverDevices();
 */
function discoverDevices() {
  logger.log("Ask for devices enumeration")
  this.mqttClient.publish('zigbee2mqtt/bridge/config/devices/get');
}

module.exports = {
  discoverDevices,
};
