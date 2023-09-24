const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { DEFAULT } = require('./constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @param {object} MqttParam - MQTT broker URL, Client MQTT username, Client MQTT password.
 * @param {string} MqttParam.mqttUrl - MQTT URL.
 * @param {string} MqttParam.mqttUsername - MQTT Username.
 * @param {string} MqttParam.mqttPassword - MQTT Password.
 * @returns {Promise} Resolve when connected.
 * @example
 * connect();
 */
async function connect({ mqttUrl, mqttUsername, mqttPassword }) {
  if (this.mqttClient) {
    logger.info(`Disconnecting existing MQTT client...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  }

  if (this.mqttRunning) {
    // Loads MQTT service
    logger.info(`Connecting Gladys to ${mqttUrl} MQTT broker...`);

    this.mqttClient = this.mqttLibrary.connect(mqttUrl, {
      username: mqttUsername,
      password: mqttPassword,
      reconnectPeriod: 5000,
      clientId: `gladys-main-instance-${Math.floor(Math.random() * 1000000)}`,
    });

    this.mqttClient.on('connect', () => {
      logger.info('Connected to MQTT container', mqttUrl);
      DEFAULT.TOPICS.forEach((topic) => {
        this.subscribe(topic, this.handleMqttMessage.bind(this));
      });
      this.gladysConnected = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_ERROR,
        payload: err,
      });
      this.gladysConnected = false;
    });

    this.mqttClient.on('offline', () => {
      logger.warn(`Disconnected from MQTT server`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
        payload: 'DISCONNECTED',
      });
      this.gladysConnected = false;
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMqttMessage(topic, message.toString());
    });
  } else {
    logger.warn("Can't connect Gladys cause MQTT not running !");
  }
}

module.exports = {
  connect,
};
