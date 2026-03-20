const { DISCOVERY_TOPIC } = require('../utils/nuki.constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Force MQTT scanning by re-subscribing to topic.
 * @example
 * nukiMQTTHandler.scan();
 */
async function scan() {
  const { mqttOk } = await this.nukiHandler.getStatus();
  if (!mqttOk) {
    throw new ServiceNotConfiguredError('Unable to discover Nuki devices until MQTT service is configured');
  }
  // Subscribe to Nuki
  this.mqttService.device.unsubscribe(DISCOVERY_TOPIC);
  this.mqttService.device.subscribe(DISCOVERY_TOPIC, this.handleMessage.bind(this));
}

module.exports = {
  scan,
};
