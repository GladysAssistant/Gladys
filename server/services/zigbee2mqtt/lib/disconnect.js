const logger = require('../../../utils/logger');
const { findOwnContainer } = require('../../../utils/dockerContainers');

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
  const container = await findOwnContainer(system, descriptor);
  if (container) {
    await system.stopContainer(container.id);
    // With its anonymous volumes (/mosquitto/data and /mosquitto/log of the broker image, unused: the broker persists
    // in its configuration folder, mounted from the disk of Gladys), left behind at each removal otherwise
    await system.removeContainer(container.id, { v: true });
  }
}

/**
 * @description Disconnect service from dependent containers, see disconnect.
 * @example
 * await disconnectContainers.call(this);
 */
async function disconnectContainers() {
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
  clearTimeout(this.healthCheckTimer);
  this.healthCheckTimer = null;
  this.emitStatusEvent();

  // Disabled: the outcome of the last installation no longer describes Zigbee2mqtt
  this.clearInstallation();
  // A send left waiting goes at once, with the idle installation: its timer would outlive the integration
  if (this.installProgressTimer !== null) {
    this.emitInstallProgress(true);
  }

  // Stop & remove MQTT container
  await removeOwnContainer(this.gladys.system, mqttContainerDescriptor);
  this.mqttRunning = false;
  this.mqttExist = false;
  this.emitStatusEvent();

  // Stop & remove zigbee2mqtt container
  await removeOwnContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
  // Without its container, Zigbee2mqtt is disabled, not "not responding"
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.zigbee2mqttConnected = false;
  clearTimeout(this.startingTimer);
  this.startingTimer = null;
  this.zigbee2mqttStarting = false;
  this.coordinatorFirmware = null;
  this.z2mContainerError = null;
  this.emitStatusEvent();
}

/**
 * @description Disconnect service from dependent containers. Counted while it runs, from its first line: the routes
 * and the setup checked before calling it are refused until it ends, as an installation started meanwhile would lose
 * the containers it creates (see refuseWhileInstalling).
 * @example
 * disconnect();
 */
async function disconnect() {
  this.runningOperations += 1;
  try {
    await disconnectContainers.call(this);
  } finally {
    this.runningOperations -= 1;
  }
}

module.exports = {
  disconnect,
};
