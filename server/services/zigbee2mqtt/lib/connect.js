const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @param {string} driverPath - Path to the USB driver.
 * @example
 * connect(driverPath);
 */
function connect(driverPath) {
  
  if (driverPath) {
    logger.info(`Zigbee2mqtt USB dongle attached to ${driverPath}`); 
    this.usbConfigured = true; 
  } else {
    logger.info(`Zigbee2mqtt USB dongle not attached`); 
    this.usbConfigured = false; 
  }
  // Loads MQTT service
  logger.log('starting MQTT service for Zigbee2mqtt');
  this.mqttClient = this.mqttLibrary.connect('mqtt://mqtt-broker', {
    username: '',
    password: '',
  });
  this.mqttClient.on('connect', () => {
    logger.info(`Connected to MQTT container mqtt://mqtt-broker`);
    Object.keys(this.topicBinds).forEach((topic) => {
      this.subscribe(topic, this.topicBinds[topic]);
    });
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_CONNECTED,
    });
    this.mqttConnected = true;
  });
  this.mqttClient.on('error', (err) => {
    logger.warn(`Error while connecting to MQTT - ${err}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_ERROR,
      payload: err,
    });
  });
  /*    this.mqttClient.on('message', (topic, message) => {
    this.handleNewMessage(topic, message.toString());
  });
*/

  //  this.mqttService = this.gladys.service.getService('mqtt');

  // Subscribe to Zigbee2mqtt topics
  this.subscribe('zigbee2mqtt/#', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
