const logger = require('../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('./constants');
const containerParams = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Updates MQTT container configuration according to required changes.
 * @param {object} configuration - MQTT service configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * updateContainer({ mqttUrl, mqttPort });
 */
async function updateContainer(configuration) {
  logger.info('MQTT: checking for required changes...');

  // Check for update request
  const { brokerContainerAvailable, mosquittoVersion } = configuration;
  if (brokerContainerAvailable && mosquittoVersion !== DEFAULT.MOSQUITTO_VERSION) {
    logger.info(`MQTT: update #${DEFAULT.MOSQUITTO_VERSION} of mosquitto container required...`);
    const dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerParams.name] },
    });

    // Remove old container
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
    logger.info(`MQTT: update #${DEFAULT.MOSQUITTO_VERSION} of mosquitto container done`);
  } else {
    logger.info('MQTT: no container update required');
  }

  return configuration;
}

module.exports = {
  updateContainer,
};
