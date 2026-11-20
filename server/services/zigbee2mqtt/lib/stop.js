const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { findOwnZ2mContainer } = require('../utils/findOwnZ2mContainer');
const { CONFIGURATION, MQTT_MODE } = require('./constants');
const { disconnectFromBroker } = require('./disconnect');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Update the restart policy of one of our containers. Best effort: a refusal of Docker is logged, the
 * caller goes on.
 * @param {object} system - Gladys system module.
 * @param {object} container - The container.
 * @param {object} descriptor - Its descriptor.
 * @param {string} name - Restart policy: "no" while stopped by the user, "always" otherwise (as in the descriptors).
 * @example
 * await updateRestartPolicy(this.gladys.system, container, zigbee2mqttContainerDescriptor, 'no');
 */
async function updateRestartPolicy(system, container, descriptor, name) {
  try {
    await system.updateContainer(container.id, { RestartPolicy: { Name: name } });
  } catch (e) {
    logger.warn(`Zigbee2mqtt: restart policy of ${descriptor.name} not set to "${name}":`, e);
  }
}

/**
 * @description Set the restart policy of one of our containers. Best effort: a refusal of Docker, to list the
 * containers or to update this one, is logged, the caller goes on.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @param {string} name - Restart policy: "no" while stopped by the user, "always" otherwise (as in the descriptors).
 * @returns {Promise<object|null>} The container, or null when there is none of ours or Docker could not list them.
 * @example
 * const container = await setRestartPolicy(this.gladys.system, zigbee2mqttContainerDescriptor, 'always');
 */
async function setRestartPolicy(system, descriptor, name) {
  let container;
  try {
    container = await findOwnZ2mContainer(system, descriptor);
  } catch (e) {
    logger.warn(`Zigbee2mqtt: restart policy of ${descriptor.name} not set to "${name}":`, e);
    return null;
  }
  if (container) {
    await updateRestartPolicy(system, container, descriptor, name);
  }
  return container;
}

/**
 * @description Stop one of our containers, after setting its restart policy to "no": Docker starts a container of
 * policy "always" again when the machine restarts, even stopped by hand. A container that cannot be looked up fails
 * the stop: it may still run.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @example
 * await stopContainer(this.gladys.system, mqttContainerDescriptor);
 */
async function stopContainer(system, descriptor) {
  const container = await findOwnZ2mContainer(system, descriptor);
  if (container) {
    await updateRestartPolicy(system, container, descriptor, 'no');
    await system.stopContainer(container.id);
  }
}

/**
 * @description Whether the saved configuration uses an external broker: Gladys then neither stops nor starts the
 * containers of ours that a former local installation may have left (see the spec, L).
 * @returns {Promise<boolean>} True with an external broker.
 * @example
 * const external = await this.isExternalBroker();
 */
async function isExternalBroker() {
  const mqttMode = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_MODE, this.serviceId);
  return mqttMode === MQTT_MODE.EXTERNAL;
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
    const external = await isExternalBroker.call(this);
    const stoppedAt = new Date().toISOString();
    // Saved first: a start of Gladys meanwhile leaves it stopped
    await this.gladys.variable.setValue(CONFIGURATION.Z2M_STOPPED, stoppedAt, this.serviceId);
    this.stopped = true;
    this.stoppedAt = stoppedAt;
    disconnectFromBroker.call(this);
    // Gladys no longer hears Zigbee2mqtt, even if a container below fails to stop: what the run told (its starting
    // window, the error of its logs, joining allowed) no longer describes anything
    this.zigbee2mqttConnected = false;
    clearTimeout(this.startingTimer);
    this.startingTimer = null;
    this.zigbee2mqttStarting = false;
    this.z2mContainerError = null;
    this.z2mRun += 1;
    if (this.z2mPermitJoin) {
      this.z2mPermitJoin = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
        payload: false,
      });
    }
    this.emitStatusEvent();

    if (!external) {
      // Zigbee2mqtt first: it stops cleanly while its broker still answers
      await stopContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
      await stopContainer(this.gladys.system, mqttContainerDescriptor);
    }

    this.mqttRunning = false;
    this.zigbee2mqttRunning = false;
    this.emitStatusEvent();
    logger.info('Zigbee2mqtt: stopped by the user');
  } finally {
    this.runningOperations -= 1;
  }
}

module.exports = {
  isExternalBroker,
  setRestartPolicy,
  stop,
};
