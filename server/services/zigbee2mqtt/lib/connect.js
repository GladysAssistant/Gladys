const logger = require('../../../utils/logger');

/**
 * @description Initialiaze service with dependencies and connect to devices.
 * @example
 * connect();
 */
function connect() {
  // Loads MQTT service
  logger.log('starting MQTT service for Zigbee2mqtt');
  this.mqttClient = this.mqtt.connect('mqtt://mqtt-broker', {
    username: '',
    password: '',
  });
  this.mqttClient.on('connect', () => {
    logger.info(`Connected to MQTT container mqtt://mqtt-broker`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT-CONNECTED,
    });
    this.connected = true;
  });
  this.mqttClient.on('error', (err) => {
    logger.warn(`Error while connecting to MQTT - ${err}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT-ERROR,
      payload: err,
    });
  });
/*    this.mqttClient.on('message', (topic, message) => {
    this.handleNewMessage(topic, message.toString());
  });
*/  

//  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Zigbee2mqtt topics
  this.mqttClient.subscribe('zigbee2mqtt/#', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
