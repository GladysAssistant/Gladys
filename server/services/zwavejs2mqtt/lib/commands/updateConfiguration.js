const logger = require('../../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('../constants');

/**
 * @description Update Z-Wave configuration.
 * @param {Object} configuration - The configuration data.
 * @example
 * zwave.updateConfiguration({ driverPath: '' });
 */
async function updateConfiguration(configuration) {
  logger.debug(`Zwave : Updating configuration...`);

  const {
    externalZwavejs2mqtt,
    driverPath,
    mqttUrl,
    mqttUsername,
    mqttPassword,
    s2UnauthenticatedKey,
    s2AuthenticatedKey,
    s2AccessControlKey,
    s0LegacyKey,
  } = configuration;

  if (externalZwavejs2mqtt !== undefined) {
    await this.gladys.variable.setValue(
      CONFIGURATION.EXTERNAL_ZWAVEJS2MQTT,
      externalZwavejs2mqtt ? '1' : '0',
      this.serviceId,
    );
    this.externalZwavejs2mqtt = externalZwavejs2mqtt;
  }

  if (!this.externalZwavejs2mqtt) {
    this.mqttUrl = DEFAULT.ZWAVEJS2MQTT_MQTT_URL_VALUE;
    this.mqttUsername = DEFAULT.ZWAVEJS2MQTT_MQTT_USERNAME_VALUE;
    this.mqttPassword = await this.gladys.variable.getValue(
      CONFIGURATION.ZWAVEJS2MQTT_MQTT_PASSWORD_BACKUP,
      this.serviceId,
    );
  }

  if (driverPath) {
    await this.gladys.variable.setValue(CONFIGURATION.DRIVER_PATH, driverPath, this.serviceId);
    this.driverPath = driverPath;
  }

  if (s2UnauthenticatedKey) {
    await this.gladys.variable.setValue(CONFIGURATION.S2_UNAUTHENTICATED, s2UnauthenticatedKey, this.serviceId);
    this.s2UnauthenticatedKey = s2UnauthenticatedKey;
  }

  if (s2AuthenticatedKey) {
    await this.gladys.variable.setValue(CONFIGURATION.S2_AUTHENTICATED, s2AuthenticatedKey, this.serviceId);
    this.s2AuthenticatedKey = s2AuthenticatedKey;
  }

  if (s2AccessControlKey) {
    await this.gladys.variable.setValue(CONFIGURATION.S2_ACCESS_CONTROL, s2AccessControlKey, this.serviceId);
    this.s2AccessControlKey = s2AccessControlKey;
  }

  if (s0LegacyKey) {
    await this.gladys.variable.setValue(CONFIGURATION.S0_LEGACY, s0LegacyKey, this.serviceId);
    this.zwavejsSOLegacyKey = s0LegacyKey;
  }

  if (mqttUrl) {
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJS2MQTT_MQTT_URL, mqttUrl, this.serviceId);
    this.mqttUrl = mqttUrl;
  }

  if (mqttUsername) {
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJS2MQTT_MQTT_USERNAME, mqttUsername, this.serviceId);
    this.mqttUsername = mqttUsername;
  }

  if (mqttPassword) {
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJS2MQTT_MQTT_PASSWORD, mqttPassword, this.serviceId);
    this.mqttPassword = mqttPassword;
  }
}

module.exports = {
  updateConfiguration,
};
