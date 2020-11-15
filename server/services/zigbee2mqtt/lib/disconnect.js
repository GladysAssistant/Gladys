const mqttContainerDescriptor = require('../docker/z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/zigbee2mqtt-container.json');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Disconnect service from dependencies.
 * @example
 * disconnect();
 */
async function disconnect() {
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;

  await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
  this.z2mEnabled = false;

  if (this.mqttClient) {
    logger.debug(`Disconnecting existing MQTT server...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  } else {
    logger.debug('Not connected');
  }
  this.gladysConnected = false;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
  });


  // Stop broker container
  let dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [mqttContainerDescriptor.name] },
  });
  [container] = dockerContainer;
  await this.gladys.system.stopContainer(container.id);
  this.mqttRunning = false;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
  });


  // Stop zigbee2mqtt container
  dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [zigbee2mqttContainerDescriptor.name] },
  });
  [container] = dockerContainer;
  await this.gladys.system.stopContainer(container.id);
  this.zigbee2mqttRunning = false;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
  });

}

module.exports = {
  disconnect,
};
