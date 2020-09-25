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
    logger.log('Installing & starting containers');

    await this.installMqttContainer();

    await this.installZ2mContainer();

    if (this.mqttRunning && this.zigbee2mqttRunning) {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', true, this.serviceId);
      this.z2mEnabled = true;
    } else {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
      this.z2mEnabled = false;
    }
  }

  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
  logger.log(mqttUrl, mqttUsername, mqttPassword);

  return {
    mqttUrl,
    mqttUsername,
    mqttPassword,
  };
}

module.exports = {
  getConfiguration,
};
