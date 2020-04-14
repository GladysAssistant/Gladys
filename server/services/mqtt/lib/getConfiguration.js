const { CONFIGURATION } = require('./constants');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  const useEmbeddedBroker = await this.gladys.variable.getValue(CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, this.serviceId);
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.MQTT_PASSWORD_KEY, this.serviceId);

  return {
    useEmbeddedBroker: !!useEmbeddedBroker,
    mqttUrl,
    mqttUsername,
    mqttPassword,
  };
}

module.exports = {
  getConfiguration,
};
