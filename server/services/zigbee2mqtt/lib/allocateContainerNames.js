const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

const MQTT_IMAGE_MARKER = mqttContainerDescriptor.Image.split(':')[0];
const Z2M_IMAGE_MARKER = z2mContainerDescriptor.Image.split(':')[0];

/**
 * @description Resolve once, then persist, the names of the containers owned by the
 * service (same resolve-then-persist pattern as the ports). Existing healthy installs
 * are adopted as-is thanks to the image proof; only a real collision with a foreign
 * container forces an alternative suffixed name.
 * @param {object} config - Service configuration properties (mutated in place).
 * @returns {Promise} Resolve when the container names are allocated.
 * @example
 * await z2m.allocateContainerNames(config);
 */
async function allocateContainerNames(config) {
  if (!config.mqttContainerName) {
    config.mqttContainerName = await resolveContainerName(
      this.gladys.system,
      mqttContainerDescriptor.name,
      MQTT_IMAGE_MARKER,
      'Zigbee2mqtt MQTT',
    );
    logger.info(`Zigbee2mqtt: using "${config.mqttContainerName}" as MQTT container name`);
  }
  if (!config.z2mContainerName) {
    config.z2mContainerName = await resolveContainerName(
      this.gladys.system,
      z2mContainerDescriptor.name,
      Z2M_IMAGE_MARKER,
      'Zigbee2mqtt',
    );
    logger.info(`Zigbee2mqtt: using "${config.z2mContainerName}" as Zigbee2mqtt container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
