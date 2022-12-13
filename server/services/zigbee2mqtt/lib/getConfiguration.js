const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Zigbee2mqtt: loading stored configuration...');

  // Load z2m parameters
  const z2mDriverPath = await this.gladys.variable.getValue(CONFIGURATION.Z2M_DRIVER_PATH, this.serviceId);
  const z2mMqttUsername = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
  const z2mMqttPassword = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);

  // Load MQTT parameters
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);

  return {
    z2mDriverPath,
    z2mMqttUsername,
    z2mMqttPassword,
    mqttUrl,
    mqttUsername,
    mqttPassword,
  };
}

module.exports = {
  getConfiguration,
};
