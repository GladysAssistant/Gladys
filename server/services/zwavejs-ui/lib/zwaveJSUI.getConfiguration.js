const { CONFIGURATION } = require('./constants');

/**
 * @description This will return the current configuration.
 * @returns {Promise<object>} Resolve with configuration.
 * @example zwaveJSUI.getConfiguration();
 */
async function getConfiguration() {
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_PASSWORD_KEY, this.serviceId);
  return {
    mqtt_url: mqttUrl,
    mqtt_username: mqttUsername,
    mqtt_password: mqttPassword,
  };
}

module.exports = {
  getConfiguration,
};
