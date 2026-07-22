const logger = require('../../../utils/logger');
const { resolveContainerName } = require('../../../utils/dockerContainers');
const { CONFIGURATION } = require('./constants');

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
    // Persist immediately, before any container is created, so a crash before
    // saveConfiguration cannot orphan a suffixed container on the next retry.
    await this.gladys.variable.setValue(CONFIGURATION.MQTT_CONTAINER_NAME, config.mqttContainerName, this.serviceId);
    logger.info(`Zigbee2mqtt: using "${config.mqttContainerName}" as MQTT container name`);
  }
  if (!config.z2mContainerName) {
    config.z2mContainerName = await resolveContainerName(
      this.gladys.system,
      z2mContainerDescriptor.name,
      Z2M_IMAGE_MARKER,
      'Zigbee2mqtt',
    );
    // Persist immediately, before any container is created, so a crash before
    // saveConfiguration cannot orphan a suffixed container on the next retry.
    await this.gladys.variable.setValue(CONFIGURATION.Z2M_CONTAINER_NAME, config.z2mContainerName, this.serviceId);
    logger.info(`Zigbee2mqtt: using "${config.z2mContainerName}" as Zigbee2mqtt container name`);
  }
}

module.exports = {
  allocateContainerNames,
};
