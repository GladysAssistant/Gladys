const logger = require('../../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('../constants');

/**
 * @description Getting Z-Wave information.
 * @returns {Promise<object>} Return Object of information.
 * @example
 * zwave.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`Zwave : Getting informations...`);

  const externalZwaveJSUIStr = await this.gladys.variable.getValue(CONFIGURATION.EXTERNAL_ZWAVEJSUI, this.serviceId);
  const externalZwaveJSUI = externalZwaveJSUIStr !== undefined && externalZwaveJSUIStr === '1';
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_URL, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, this.serviceId);
  const mqttTopicPrefix = await this.gladys.variable.getValue(
    CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX,
    this.serviceId,
  );
  const mqttTopicWithLocationStr = await this.gladys.variable.getValue(
    CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION,
    this.serviceId,
  );
  const mqttTopicWithLocation = mqttTopicWithLocationStr !== undefined && mqttTopicWithLocationStr === '1';
  const driverPath = await this.gladys.variable.getValue(CONFIGURATION.DRIVER_PATH, this.serviceId);
  const s2UnauthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_UNAUTHENTICATED, this.serviceId);
  const s2AuthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_AUTHENTICATED, this.serviceId);
  const s2AccessControlKey = await this.gladys.variable.getValue(CONFIGURATION.S2_ACCESS_CONTROL, this.serviceId);
  const s0LegacyKey = await this.gladys.variable.getValue(CONFIGURATION.S0_LEGACY, this.serviceId);

  return {
    externalZwaveJSUI,
    zwaveJSUIVersion: this.zwaveJSUIVersion,
    zwaveJSUIExpectedVersion: DEFAULT.ZWAVEJSUI_VERSION_EXPECTED,
    driverPath,
    s2UnauthenticatedKey,
    s2AuthenticatedKey,
    s2AccessControlKey,
    s0LegacyKey,
    mqttUrl,
    mqttUsername,
    mqttPassword,
    mqttTopicPrefix,
    mqttTopicWithLocation,
  };
}

module.exports = {
  getConfiguration,
};
