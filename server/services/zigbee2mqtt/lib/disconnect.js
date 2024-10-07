const logger = require('../../../utils/logger');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

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

  // Stop & remove MQTT container
  let dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [mqttContainerDescriptor.name] },
  });
  if (dockerContainer.length > 0) {
    [container] = dockerContainer;
    await this.gladys.system.stopContainer(container.id);
    await this.gladys.system.removeContainer(container.id);
  }
  this.mqttRunning = false;
  this.emitStatusEvent();

  // Stop & remove zigbee2mqtt container
  dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [zigbee2mqttContainerDescriptor.name] },
  });
  if (dockerContainer.length > 0) {
    [container] = dockerContainer;
    await this.gladys.system.stopContainer(container.id);
    await this.gladys.system.removeContainer(container.id);
  }
  this.zigbee2mqttRunning = false;
  this.zigbee2mqttConnected = false;
  this.emitStatusEvent();
}

module.exports = {
  disconnect,
};
