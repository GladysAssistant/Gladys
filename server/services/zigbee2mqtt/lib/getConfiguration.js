const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get Z2M configuration.
 * @returns {Promise} Current Z2M network configuration.
 * @example
 * const config = await z2m.getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Zigbee2mqtt: loading stored configuration...');

  // Load z2m parameters
  const z2mDriverPath = await this.gladys.variable.getValue(CONFIGURATION.Z2M_DRIVER_PATH, this.serviceId);
  const z2mDongleName = await this.gladys.variable.getValue(CONFIGURATION.ZIGBEE_DONGLE_NAME, this.serviceId);
  const z2mTcpPort = await this.gladys.variable.getValue(CONFIGURATION.Z2M_TCP_PORT, this.serviceId);
  const z2mMqttUsername = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
  const z2mMqttPassword = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);
  const mqttMode = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_MODE, this.serviceId);

  // Load MQTT parameters
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);

  // Load version parameters
  const dockerMqttVersion = await this.gladys.variable.getValue(CONFIGURATION.DOCKER_MQTT_VERSION, this.serviceId);
  const dockerZ2mVersion = await this.gladys.variable.getValue(CONFIGURATION.DOCKER_Z2M_VERSION, this.serviceId);
  // Gladys params
  const timezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);

  return {
    z2mDriverPath,
    z2mDongleName,
    z2mTcpPort,
    z2mMqttUsername,
    z2mMqttPassword,
    mqttMode,
    mqttUrl,
    mqttUsername,
    mqttPassword,
    dockerMqttVersion,
    dockerZ2mVersion,
    timezone,
  };
}

module.exports = {
  getConfiguration,
};
