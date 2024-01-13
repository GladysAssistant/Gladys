const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  this.mqttService = this.nukiHandler.gladys.service.getService('mqtt');
  
  // Subscribe to Nuki topics
  this.mqttService.device.subscribe(DISCOVERY_TOPIC, this.handleMessage.bind(this));
  
}

module.exports = {
  connect,
};
