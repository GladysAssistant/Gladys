const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { DEFAULT } = require('./constants');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Checks if version is the latest for this service, if not, it removes existing containers.
 * @param {object} config - Service configuration properties.
 * @example
 * await z2m.checkForContainerUpdates(config);
 */
async function checkForContainerUpdates(config) {
  logger.info('Checking for current installed versions and required updates...');

  // Check for MQTT container version
  if (config.dockerMqttVersion !== DEFAULT.DOCKER_MQTT_VERSION) {
    logger.info(`MQTT container: update #${DEFAULT.DOCKER_MQTT_VERSION} of the container required...`);

    // Only our own container is removed: a user container carrying the same name is left alone
    const container = await findManagedContainer(this.gladys.system, mqttContainerDescriptor);

    if (container) {
      logger.debug('Removing current installed MQTT container...');
      // If container is present, we remove it
      // The init process will create it again
      await this.gladys.system.removeContainer(container.id, { force: true });
    }

    // Update to last version
    config.dockerMqttVersion = DEFAULT.DOCKER_MQTT_VERSION;
    logger.info(`MQTT container: update #${DEFAULT.DOCKER_MQTT_VERSION} of the container done`);
  }

  // Check for Z2M container version
  if (config.dockerZ2mVersion !== DEFAULT.DOCKER_Z2M_VERSION) {
    logger.info(`Z2M container: update #${DEFAULT.DOCKER_Z2M_VERSION} of the container required...`);

    const container = await findManagedContainer(this.gladys.system, z2mContainerDescriptor);

    if (container) {
      logger.debug('Removing current installed Z2M container...');
      // If container is present, we remove it
      // The init process will create it again
      await this.gladys.system.removeContainer(container.id, { force: true });
    }

    // Update to last version
    config.dockerZ2mVersion = DEFAULT.DOCKER_Z2M_VERSION;
    logger.info(`Z2M container: update #${DEFAULT.DOCKER_Z2M_VERSION} of the container done`);
  }
}

module.exports = {
  checkForContainerUpdates,
};
