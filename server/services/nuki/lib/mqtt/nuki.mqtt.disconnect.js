const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');

/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
function disconnect() {
  // Unsubscribe to Nuki topics
  this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
  
}

module.exports = {
  disconnect,
};
