const logger = require('../../../utils/logger');
const { findManagedContainer, hasServiceLabel } = require('../../../utils/dockerContainers');
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
    // Only our own container is removed: a user container carrying the same name is left alone
    const container = await findManagedContainer(this.gladys.system, containerParams);

    // The version is stored as soon as Gladys configures its broker. A container created
    // before the label existed, from the public image, with no stored version, is a broker
    // Gladys never configured: a user one carrying our name, left untouched.
    if (container && !mosquittoVersion && !hasServiceLabel(container)) {
      logger.warn(
        `MQTT: container "${containerParams.name}" was not configured by Gladys (no label and no stored version), leaving it untouched`,
      );
      return configuration;
    }

    // Remove old container
    if (container) {
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
