const logger = require('../../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('../constants');

/**
 * @description Update Z-Wave configuration.
 * @param {object} configuration - The configuration data.
 * @example
 * zwave.updateConfiguration({ driverPath: '' });
 */
async function updateConfiguration(configuration) {
  logger.debug(`Zwave : Updating configuration...`);

  const {
    externalZwaveJSUI,
    driverPath,
    mqttUrl,
    mqttUsername,
    mqttPassword,
    mqttTopicPrefix,
    mqttTopicWithLocation,
    s2UnauthenticatedKey,
    s2AuthenticatedKey,
    s2AccessControlKey,
    s0LegacyKey,
  } = configuration;

  if (externalZwaveJSUI !== undefined) {
    await this.gladys.variable.setValue(
      CONFIGURATION.EXTERNAL_ZWAVEJSUI,
      externalZwaveJSUI ? '1' : '0',
      this.serviceId,
    );
  }

  if (!externalZwaveJSUI) {
    await this.gladys.variable.setValue(
      CONFIGURATION.ZWAVEJSUI_MQTT_URL,
      DEFAULT.ZWAVEJSUI_MQTT_URL_VALUE,
      this.serviceId,
    );
    await this.gladys.variable.setValue(
      CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME,
      DEFAULT.ZWAVEJSUI_MQTT_USERNAME_VALUE,
      this.serviceId,
    );

    const defaultMqttPassword = await this.gladys.variable.getValue(
      CONFIGURATION.DEFAULT_ZWAVEJSUI_MQTT_PASSWORD,
      this.serviceId,
    );
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, defaultMqttPassword, this.serviceId);

    if (driverPath) {
      await this.gladys.variable.setValue(CONFIGURATION.DRIVER_PATH, driverPath, this.serviceId);
    }

    if (s2UnauthenticatedKey) {
      await this.gladys.variable.setValue(CONFIGURATION.S2_UNAUTHENTICATED, s2UnauthenticatedKey, this.serviceId);
    }

    if (s2AuthenticatedKey) {
      await this.gladys.variable.setValue(CONFIGURATION.S2_AUTHENTICATED, s2AuthenticatedKey, this.serviceId);
    }

    if (s2AccessControlKey) {
      await this.gladys.variable.setValue(CONFIGURATION.S2_ACCESS_CONTROL, s2AccessControlKey, this.serviceId);
    }

    if (s0LegacyKey) {
      await this.gladys.variable.setValue(CONFIGURATION.S0_LEGACY, s0LegacyKey, this.serviceId);
    }
  }

  if (externalZwaveJSUI) {
    if (mqttUrl) {
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_URL, mqttUrl, this.serviceId);
    }

    if (mqttUsername) {
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, mqttUsername, this.serviceId);
    }

    if (mqttUsername === '') {
      await this.gladys.variable.destroy(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, this.serviceId);
    }

    if (mqttPassword) {
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, mqttPassword, this.serviceId);
    }

    if (mqttPassword === '') {
      await this.gladys.variable.destroy(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, this.serviceId);
    }

    if (mqttTopicPrefix) {
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX, mqttTopicPrefix, this.serviceId);
    }

    if (mqttTopicWithLocation !== undefined) {
      await this.gladys.variable.setValue(
        CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION,
        mqttTopicWithLocation ? '1' : '0',
        this.serviceId,
      );
    }
  }
}

module.exports = {
  updateConfiguration,
};
