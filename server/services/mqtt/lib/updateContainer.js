const logger = require('../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('./constants');
const containerParams = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Updates MQTT container configuration according to required changes.
 * @param {Object} configuration - MQTT service configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * updateContainer({ mqttUrl, mqttPort });
 */
async function updateContainer(configuration) {
  logger.info('MQTT: checking for required changes...');

  // Check for port listener option
  const { brokerContainerAvailable, mosquittoVersion } = configuration;
  if (brokerContainerAvailable && !mosquittoVersion) {
    logger.info('MQTT: update to mosquitto v2 required...');
    const dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerParams.name] },
    });

    // Remove non versionned container
    if (dockerContainers.length !== 0) {
      const [container] = dockerContainers;
      await this.gladys.system.removeContainer(container.id, { force: true });
    }

    // Reinstall container with explicit version
    const newContainer = await this.installContainer(false);
    await this.gladys.system.restartContainer(newContainer.id);

    await this.gladys.variable.setValue(
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      this.serviceId,
    );
    logger.info('MQTT: update to mosquitto v2 done');
  }

  return configuration;
}

module.exports = {
  updateContainer,
};
