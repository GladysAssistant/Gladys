const logger = require('../../../utils/logger');
const { getContainersByExactName } = require('../../../utils/dockerContainers');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  let container;

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
  this.emitStatusEvent();

  // Only tear down the containers we own (names resolved and persisted at init).
  // If a name was never persisted, we never created that container: nothing to do.
  const { mqttContainerName, z2mContainerName } = await this.getConfiguration();

  // Stop & remove MQTT container
  if (mqttContainerName) {
    const dockerContainer = await getContainersByExactName(this.gladys.system, mqttContainerName);
    if (dockerContainer.length > 0) {
      [container] = dockerContainer;
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);
    }
  }
  this.mqttRunning = false;
  this.emitStatusEvent();

  // Stop & remove zigbee2mqtt container
  if (z2mContainerName) {
    const dockerContainer = await getContainersByExactName(this.gladys.system, z2mContainerName);
    if (dockerContainer.length > 0) {
      [container] = dockerContainer;
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);
    }
  }
  this.zigbee2mqttRunning = false;
  this.zigbee2mqttConnected = false;
  this.coordinatorFirmware = null;
  this.z2mContainerError = null;
  this.emitStatusEvent();
}

module.exports = {
  disconnect,
};
