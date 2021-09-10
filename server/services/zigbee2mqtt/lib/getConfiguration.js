const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  // Run existing containers if Zigbee2mqtt is enabled
  logger.log('z2mEnabled state :', this.z2mEnabled);
  if (this.z2mEnabled) {
    if (this.dockerBased) {
      logger.log('Installing & starting containers');
      await this.installMqttContainer();
      await this.installZ2mContainer();
    }

    if (this.mqttRunning && this.zigbee2mqttRunning) {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', this.dockerBased ? '1' : '2', this.serviceId);
      this.z2mEnabled = true;
    } else {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', '0', this.serviceId);
      this.z2mEnabled = false;
    }
  }

  if (this.dockerBased) {
    const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
    const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
    const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
    const mqttExternal = false;

    return {
      mqttExternal,
      mqttUrl,
      mqttUsername,
      mqttPassword,
    };
  }

  const mqttExternal = true;
  return {
    mqttExternal,
  };
}

module.exports = {
  getConfiguration,
};
