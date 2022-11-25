const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

const saveOrDestroy = async (variableManager, key, value, serviceId) => {
  if (value === undefined || value === null) {
    await variableManager.destroy(key, serviceId);
  } else {
    await variableManager.setValue(key, value, serviceId);
  }
};

/**
 * @description Save Z2M configuration.
 * @param {Object} config - Z2M service configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * await z2m.saveConfiguration(config);
 */
async function saveConfiguration(config) {
  const { z2mDriverPath, z2mMqttUsername, z2mMqttPassword, mqttUrl, mqttUsername, mqttPassword } = config;

  logger.debug('Zigbee2mqtt: storing configuration...');

  const keyValueMap = {
    [CONFIGURATION.Z2M_DRIVER_PATH]: z2mDriverPath,
    [CONFIGURATION.Z2M_MQTT_USERNAME_KEY]: z2mMqttUsername,
    [CONFIGURATION.Z2M_MQTT_PASSWORD_KEY]: z2mMqttPassword,
    [CONFIGURATION.MQTT_URL_KEY]: mqttUrl,
    [CONFIGURATION.GLADYS_MQTT_USERNAME_KEY]: mqttUsername,
    [CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY]: mqttPassword,
  };

  const variableKeys = Object.keys(keyValueMap);

  await Promise.all(
    variableKeys.map((key) => saveOrDestroy(this.gladys.variable, key, keyValueMap[key], this.serviceId)),
  );

  logger.debug('Zigbee2mqtt: configuration stored');
}

module.exports = {
  saveConfiguration,
};
