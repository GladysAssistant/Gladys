const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @param {object} MqttParam - MQTT broker URL, Client MQTT username, Client MQTT password.
 * @param {string} MqttParam.mqttUrl - MQTT URL.
 * @param {string} MqttParam.mqttUsername - MQTT Username.
 * @param {string} MqttParam.mqttPassword - MQTT Password.
 * @param {string} MqttParam.mqttMode - MQTT Password.
 * @returns {Promise} Resolve when connected.
 * @example
 * connect();
 */
async function connect({ mqttUrl, mqttUsername, mqttPassword, mqttMode }) {
  if (this.mqttClient) {
    logger.info(`Disconnecting existing MQTT client...`);
    this.mqttClient.end();
    this.mqttClient.removeAllListeners();
    this.mqttClient = null;
  }

  if (this.mqttRunning || mqttMode === 'external') {
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
      this.mqttRunning = true;
      this.mqttExist = true;
      this.emitStatusEvent();
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      this.gladysConnected = false;
      this.zigbee2mqttConnected = false;
      this.emitStatusEvent();
    });

    this.mqttClient.on('offline', () => {
      logger.warn(`Disconnected from MQTT server`);
      this.gladysConnected = false;
      this.zigbee2mqttConnected = false;
      this.emitStatusEvent();
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
