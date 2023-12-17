const { CONFIGURATION } = require('./constants');

/**
 * @description This will save the Z-Wave JS UI MQTT configuration.
 * @param {object} configuration - The configuration object.
 * @example zwaveJSUI.saveConfiguration({
 * });
 */
async function saveConfiguration(configuration) {
  await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJS_UI_MQTT_URL_KEY, configuration.mqtt_url, this.serviceId);
  await this.gladys.variable.setValue(
    CONFIGURATION.ZWAVEJS_UI_MQTT_USERNAME_KEY,
    configuration.mqtt_username,
    this.serviceId,
  );
  await this.gladys.variable.setValue(
    CONFIGURATION.ZWAVEJS_UI_MQTT_PASSWORD_KEY,
    configuration.mqtt_password,
    this.serviceId,
  );
}

module.exports = {
  saveConfiguration,
};
