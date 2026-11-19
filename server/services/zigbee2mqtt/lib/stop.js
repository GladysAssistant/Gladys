const logger = require('../../../utils/logger');
const { findOwnZ2mContainer } = require('../utils/findOwnZ2mContainer');
const { CONFIGURATION } = require('./constants');
const { disconnectFromBroker } = require('./disconnect');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Set the restart policy of one of our containers. Best effort: a refusal of Docker is logged, the caller
 * goes on.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @param {string} name - Restart policy: "no" while stopped by the user, "always" otherwise (as in the descriptors).
 * @returns {Promise<object|null>} The container, or null when there is none of ours.
 * @example
 * const container = await setRestartPolicy(this.gladys.system, zigbee2mqttContainerDescriptor, 'no');
 */
async function setRestartPolicy(system, descriptor, name) {
  const container = await findOwnZ2mContainer(system, descriptor);
  if (!container) {
    return null;
  }
  try {
    await system.updateContainer(container.id, { RestartPolicy: { Name: name } });
  } catch (e) {
    logger.warn(`Zigbee2mqtt: restart policy of ${descriptor.name} not set to "${name}":`, e);
  }
  return container;
}

/**
 * @description Stop one of our containers, after setting its restart policy to "no": Docker starts a container of
 * policy "always" again when the machine restarts, even stopped by hand.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @example
 * await stopContainer(this.gladys.system, mqttContainerDescriptor);
 */
async function stopContainer(system, descriptor) {
  const container = await setRestartPolicy(system, descriptor, 'no');
  if (container) {
    await system.stopContainer(container.id);
  }
}

/**
 * @description Stop Zigbee2mqtt at the request of the user, until the user starts it again (see start): remembered,
 * a start of Gladys, the watch of the dongle or a restart of the machine start nothing. Gladys disconnects from the
 * broker; our containers are stopped and kept, to start again at once with their logs. With an external broker, Gladys
 * only disconnects from it.
 * @returns {Promise} Resolve once stopped.
 * @example
 * await this.stop();
 */
async function stop() {
  this.refuseWhileInstalling('stop Zigbee2mqtt');
  this.runningOperations += 1;
  try {
    const stoppedAt = new Date().toISOString();
    // Saved first: a start of Gladys meanwhile leaves it stopped
    await this.gladys.variable.setValue(CONFIGURATION.Z2M_STOPPED, stoppedAt, this.serviceId);
    this.stopped = true;
    this.stoppedAt = stoppedAt;
    disconnectFromBroker.call(this);

    // Zigbee2mqtt first: it stops cleanly while its broker still answers
    await stopContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
    await stopContainer(this.gladys.system, mqttContainerDescriptor);

    this.mqttRunning = false;
    this.zigbee2mqttRunning = false;
    this.zigbee2mqttConnected = false;
    clearTimeout(this.startingTimer);
    this.startingTimer = null;
    this.zigbee2mqttStarting = false;
    this.z2mContainerError = null;
    this.emitStatusEvent();
    logger.info('Zigbee2mqtt: stopped by the user');
  } finally {
    this.runningOperations -= 1;
  }
}

module.exports = {
  setRestartPolicy,
  stop,
};
