const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Save Z2M configuration.
 * @param {object} config - Z2M service configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * await z2m.saveConfiguration(config);
 */
async function saveConfiguration(config) {
  logger.debug('Zigbee2mqtt: storing configuration...');

  const keyValueMap = {
    [CONFIGURATION.Z2M_TCP_PORT]: config.z2mTcpPort,
    [CONFIGURATION.Z2M_MQTT_USERNAME_KEY]: config.z2mMqttUsername,
    [CONFIGURATION.Z2M_MQTT_PASSWORD_KEY]: config.z2mMqttPassword,
    [CONFIGURATION.MQTT_URL_KEY]: config.mqttUrl,
    [CONFIGURATION.GLADYS_MQTT_USERNAME_KEY]: config.mqttUsername,
    [CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY]: config.mqttPassword,
    [CONFIGURATION.DOCKER_MQTT_VERSION]: config.dockerMqttVersion,
    [CONFIGURATION.DOCKER_Z2M_VERSION]: config.dockerZ2mVersion,
    [CONFIGURATION.Z2M_MQTT_MODE]: config.mqttMode,
  };

  const variableKeys = Object.keys(keyValueMap);

  await Promise.all(variableKeys.map((key) => this.saveOrDestroyVariable(key, keyValueMap[key])));

  logger.debug('Zigbee2mqtt: configuration stored');
}

module.exports = {
  saveConfiguration,
};
