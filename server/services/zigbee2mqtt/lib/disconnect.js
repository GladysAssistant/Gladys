const mqttContainerDescriptor = require('../docker/z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/zigbee2mqtt-container.json');
const logger = require('../../../utils/logger');

/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
async function disconnect() {
  this.mqttConnected = false;
  this.z2mConnected = false;

  await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);

  if (this.mqttClient) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Not connected');
  }

  // Stop broker docker container
  let dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [mqttContainerDescriptor.name] },
  });
  [container] = dockerContainer;
  await this.gladys.system.stopContainer(container.id);
  this.mqttContainerRunning = false;

  // Stop zigbee2mqtt docker container
  dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [zigbee2mqttContainerDescriptor.name] },
  });
  [container] = dockerContainer;
  await this.gladys.system.stopContainer(container.id);
  this.z2mContainerRunning = false;
}

module.exports = {
  disconnect,
};
