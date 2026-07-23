const { resolveContainerName } = require('../../../utils/dockerContainers');
const { CONFIGURATION } = require('./constants');
const logger = require('../../../utils/logger');
const containerDescriptor = require('../docker/eclipse-mosquitto-container.json');

const IMAGE_MARKER = containerDescriptor.Image.split(':')[0];

/**
 * @description Resolve once, then persist, the name of the mosquitto broker container we own.
 * An existing container keeping the default name is adopted only when its image proves it is
 * a mosquitto broker; otherwise (a foreign container squatting the name) a random suffix is
 * allocated and persisted. Once persisted, the name is reused as-is on later calls.
 * @returns {Promise<string>} Resolve with the broker container name to use.
 * @example
 * const name = await mqtt.getBrokerContainerName();
 */
async function getBrokerContainerName() {
  const persisted = await this.gladys.variable.getValue(CONFIGURATION.MQTT_CONTAINER_NAME, this.serviceId);
  if (persisted) {
    return persisted;
  }
  const name = await resolveContainerName(this.gladys.system, containerDescriptor.name, IMAGE_MARKER, 'MQTT');
  await this.gladys.variable.setValue(CONFIGURATION.MQTT_CONTAINER_NAME, name, this.serviceId);
  logger.info(`MQTT: using "${name}" as broker container name`);
  return name;
}

module.exports = {
  getBrokerContainerName,
};
