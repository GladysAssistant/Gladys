const { CONFIGURATION } = require('./constants');
const logger = require('../../../utils/logger');
const containerDescriptor = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.MQTT_PASSWORD_KEY, this.serviceId);

  let brokerContainerAvailable = false;
  const dockerBased = await this.gladys.system.isDocker();

  let useEmbeddedBroker = false;
  let networkModeValid = false;
  let mosquittoVersion = null;

  // Look for broker docker image
  if (dockerBased) {
    try {
      // In case the docker socket is not available
      // It's ok, we don't crash
      networkModeValid = await this.checkDockerNetwork();
      const dockerImages = await this.gladys.system.getContainers({
        all: true,
        filters: {
          name: [containerDescriptor.name],
        },
      });
      brokerContainerAvailable = dockerImages.length > 0;
    } catch (e) {
      logger.debug(e);
    }

    const useEmbeddedBrokerVariable = await this.gladys.variable.getValue(
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      this.serviceId,
    );
    // Boolean stored as integer, we need to check it
    useEmbeddedBroker = networkModeValid && useEmbeddedBrokerVariable !== '0';
    mosquittoVersion = await this.gladys.variable.getValue(CONFIGURATION.MQTT_MOSQUITTO_VERSION, this.serviceId);
  }

  return {
    mqttUrl,
    mqttUsername,
    mqttPassword,
    useEmbeddedBroker,
    dockerBased,
    brokerContainerAvailable,
    networkModeValid,
    mosquittoVersion,
  };
}

module.exports = {
  getConfiguration,
};
