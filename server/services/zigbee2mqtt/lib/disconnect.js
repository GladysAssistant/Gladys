const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  let container;

  const z2mEnabled = await this.gladys.variable.getValue('ZIGBEE2MQTT_ENABLED', this.serviceId);
  this.z2mEnabled = false;

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
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
  });

  // Stop MQTT container
  if (z2mEnabled == '1') {
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
    this.zigbee2mqttConnected = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
  }
}

module.exports = {
  disconnect,
};
