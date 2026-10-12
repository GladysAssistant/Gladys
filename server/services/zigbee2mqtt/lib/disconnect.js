const logger = require('../../../utils/logger');
const { findContainerByName, isManagedByGladys } = require('../../../utils/dockerContainers');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Stop and remove one of our containers. A container carrying our
 * name but not created by Gladys is left untouched.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @example
 * await removeOwnContainer(gladys.system, mqttContainerDescriptor);
 */
async function removeOwnContainer(system, descriptor) {
  const container = await findContainerByName(system, descriptor.name);
  if (!container) {
    return;
  }
  if (!(await isManagedByGladys(system, container, descriptor))) {
    logger.warn(`Zigbee2mqtt: container "${descriptor.name}" was not created by Gladys, leaving it untouched`);
    return;
  }
  await system.stopContainer(container.id);
  await system.removeContainer(container.id);
}

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  // Stop backup reccurent job
  if (this.backupScheduledJob) {
    this.backupScheduledJob.cancel();
  }

  // Disconnect from MQTT broker
  if (this.mqttClient) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Not connected');
  }
  this.gladysConnected = false;
  this.mqttConnectionError = null;
  this.emitStatusEvent();

  // Stop & remove MQTT container
  await removeOwnContainer(this.gladys.system, mqttContainerDescriptor);
  this.mqttRunning = false;
  this.emitStatusEvent();

  // Stop & remove zigbee2mqtt container
  await removeOwnContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
  this.zigbee2mqttRunning = false;
  this.zigbee2mqttConnected = false;
  this.coordinatorFirmware = null;
  this.z2mContainerError = null;
  this.emitStatusEvent();
}

module.exports = {
  disconnect,
};
