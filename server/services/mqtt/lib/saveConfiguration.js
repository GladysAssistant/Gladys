const { CONFIGURATION } = require('./constants');

const updateOrDestroyVariable = async (key, value, serviceId) => {
  if (value && value.length > 0) {
    await this.gladys.variable.setValue(key, value, serviceId);
  } else {
    await this.gladys.variable.destroy(key, serviceId);
  }
};

/**
 * @description Save MQTT configuration.
 * @param {Object} configuration - MQTT configuration.
 * @param {string} [configuration.mqttUrl] - MQTT URL.
 * @param {string} [configuration.mqttUsername] - MQTT username.
 * @param {string} [configuration.mqttPassword] - MQTT password.
 * @param {string} [configuration.useEmbeddedBroker] - MQTT embedded broker.
 * @example
 * saveConfiguration(configuration);
 */
async function saveConfiguration({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker }) {
  await updateOrDestroyVariable(CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, useEmbeddedBroker, this.serviceId);
  await updateOrDestroyVariable(CONFIGURATION.MQTT_URL_KEY, mqttUrl, this.serviceId);
  await updateOrDestroyVariable(CONFIGURATION.MQTT_USERNAME_KEY, mqttUsername, this.serviceId);
  await updateOrDestroyVariable(CONFIGURATION.MQTT_PASSWORD_KEY, mqttPassword, this.serviceId);
}

module.exports = {
  saveConfiguration,
};
