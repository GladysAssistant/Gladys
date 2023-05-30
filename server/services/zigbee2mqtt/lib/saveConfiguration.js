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
 * @param {object} config - Z2M service configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * await z2m.saveConfiguration(config);
 */
async function saveConfiguration(config) {
  logger.debug('Zigbee2mqtt: storing configuration...');

  const keyValueMap = {
    [CONFIGURATION.Z2M_DRIVER_PATH]: config.z2mDriverPath,
    [CONFIGURATION.ZIGBEE_DONGLE_NAME]: config.z2mDongleName,
    [CONFIGURATION.Z2M_MQTT_USERNAME_KEY]: config.z2mMqttUsername,
    [CONFIGURATION.Z2M_MQTT_PASSWORD_KEY]: config.z2mMqttPassword,
    [CONFIGURATION.MQTT_URL_KEY]: config.mqttUrl,
    [CONFIGURATION.GLADYS_MQTT_USERNAME_KEY]: config.mqttUsername,
    [CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY]: config.mqttPassword,
    [CONFIGURATION.DOCKER_MQTT_VERSION]: config.dockerMqttVersion,
    [CONFIGURATION.DOCKER_Z2M_VERSION]: config.dockerZ2mVersion,
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
