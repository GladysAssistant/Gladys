const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { DEFAULT } = require('./constants');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Checks if version is the latest for this service, if not, it removes existing containers. Called once
 * the images of the new versions are downloaded (see init).
 * @param {object} config - Service configuration properties.
 * @returns {Promise<Array<string>>} Resolve with the images of the removed containers, removed by init once the new
 * containers exist.
 * @example
 * const replacedImages = await z2m.checkForContainerUpdates(config);
 */
async function checkForContainerUpdates(config) {
  logger.info('Checking for current installed versions and required updates...');

  const mqttUpdateRequired = config.dockerMqttVersion !== DEFAULT.DOCKER_MQTT_VERSION;
  const z2mUpdateRequired = config.dockerZ2mVersion !== DEFAULT.DOCKER_Z2M_VERSION;

  // Resolve every container before removing any: a user container carrying one of our
  // names aborts the whole update (ConflictError) before anything is destroyed
  let mqttContainer = null;
  let z2mContainer = null;
  try {
    mqttContainer = mqttUpdateRequired ? await findManagedContainer(this.gladys.system, mqttContainerDescriptor) : null;
    z2mContainer = z2mUpdateRequired ? await findManagedContainer(this.gladys.system, z2mContainerDescriptor) : null;
  } catch (e) {
    // Shown as is by the setup page, so the user reads which container to rename
    this.z2mContainerError = { code: null, message: e.message };
    this.emitStatusEvent();
    throw e;
  }

  const replacedImages = [];
  // Check for MQTT container version
  if (mqttUpdateRequired) {
    logger.info(`MQTT container: update #${DEFAULT.DOCKER_MQTT_VERSION} of the container required...`);

    if (mqttContainer) {
      logger.debug('Removing current installed MQTT container...');
      // If container is present, we remove it
      // The init process will create it again
      // With its anonymous volumes (/mosquitto/data and /mosquitto/log of the image, unused), left behind otherwise
      await this.gladys.system.removeContainer(mqttContainer.id, { force: true, v: true });
      replacedImages.push(mqttContainer.image);
    }

    // Update to last version
    config.dockerMqttVersion = DEFAULT.DOCKER_MQTT_VERSION;
    logger.info(`MQTT container: update #${DEFAULT.DOCKER_MQTT_VERSION} of the container done`);
  }

  // Check for Z2M container version
  if (z2mUpdateRequired) {
    logger.info(`Z2M container: update #${DEFAULT.DOCKER_Z2M_VERSION} of the container required...`);

    if (z2mContainer) {
      logger.debug('Removing current installed Z2M container...');
      // If container is present, we remove it
      // The init process will create it again
      await this.gladys.system.removeContainer(z2mContainer.id, { force: true });
      replacedImages.push(z2mContainer.image);
    }

    // Update to last version
    config.dockerZ2mVersion = DEFAULT.DOCKER_Z2M_VERSION;
    logger.info(`Z2M container: update #${DEFAULT.DOCKER_Z2M_VERSION} of the container done`);
  }

  return replacedImages;
}

module.exports = {
  checkForContainerUpdates,
};
