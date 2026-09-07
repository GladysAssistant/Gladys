const logger = require('../../../utils/logger');
const { DEFAULT, MQTT_CONNECTION_ERROR } = require('./constants');
const { getMqttConnectionError } = require('../utils/getMqttConnectionError');

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

  const externalBroker = mqttMode === 'external';

  if (this.mqttRunning || externalBroker) {
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
      this.mqttConnectionError = null;
      this.emitStatusEvent();
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      this.gladysConnected = false;
      this.zigbee2mqttConnected = false;
      const connectionError = getMqttConnectionError(err);
      const authenticationFailed =
        connectionError.code === MQTT_CONNECTION_ERROR.BAD_CREDENTIALS ||
        connectionError.code === MQTT_CONNECTION_ERROR.NOT_AUTHORIZED;
      // On a Gladys-managed broker, only authentication failures are worth showing: the client
      // reconnects every 5 seconds, so a network error simply means the Mosquitto container is
      // still starting or restarting, and telling the user to check the broker URL would be a
      // wrong diagnosis. The Gladys <-> MQTT link already turns red through `gladysConnected`.
      this.mqttConnectionError = externalBroker || authenticationFailed ? connectionError : null;
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
