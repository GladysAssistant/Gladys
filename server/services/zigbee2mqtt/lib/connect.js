const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect({ mqttUrl, mqttUsername, mqttPassword }) {

  // Loads MQTT service
  logger.log('Connecting Gladys to ', mqttUrl, mqttUsername, mqttPassword);
  // set LAN IP instead of mqtt4z2m for development tests
  this.mqttClient = this.mqttLibrary.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000,
    clientId: 'gladys',
  });
  this.mqttClient.on('connect', () => {
    logger.info('Connected to MQTT container', mqttUrl);
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
  this.mqttClient.on('message', (topic, message) => {
    this.handleMqttMessage(topic, message.toString());
  });

    // Subscribe to Zigbee2mqtt topics
//      this.subscribe('zigbee2mqtt/#', this.handleMqttMessage.bind(this));
  
}

module.exports = {
  connect,
};
