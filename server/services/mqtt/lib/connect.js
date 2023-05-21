const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Connect and listen to all topics.
 * @param {object} configuration - MQTT configuration.
 * @param {string} [configuration.mqttUrl] - MQTT URL.
 * @param {string} [configuration.mqttUsername] - MQTT username.
 * @param {string} [configuration.mqttPassword] - MQTT password.
 * @example
 * connect({
 *  mqttUrl: 'http://localhost:1883',
 *  mqttUsername: 'mqttUser',
 *  mqttPassword: 'mqttPassword',
 * });
 */
async function connect({ mqttUrl, mqttUsername, mqttPassword }) {
  if (!mqttUrl) {
    this.configured = false;
    throw new ServiceNotConfiguredError('MQTT is not configured.');
  }
  this.configured = true;

  if (this.mqttClient) {
    this.disconnect();
  }

  logger.debug(`Trying to connect to MQTT server ${mqttUrl}...`);
  this.mqttClient = this.mqttLibrary.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000,
    clientId: `gladys-main-instance-${Math.floor(Math.random() * 1000000)}`,
  });

  this.mqttClient.on('connect', () => {
    logger.info(`Connected to MQTT server ${mqttUrl}`);

    Object.keys(this.topicBinds).forEach((topic) => {
      this.subscribe(topic, this.topicBinds[topic]);
    });
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.CONNECTED,
    });

    this.connected = true;
  });
  this.mqttClient.on('error', (err) => {
    logger.warn(`Error while connecting to MQTT - ${err}`);

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: err,
    });

    this.disconnect();
  });
  this.mqttClient.on('offline', () => {
    logger.warn(`Disconnected from MQTT server`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
      payload: 'DISCONNECTED',
    });
    this.connected = false;
  });
  this.mqttClient.on('message', (topic, message) => {
    this.handleNewMessage(topic, message.toString());
  });
}

module.exports = {
  connect,
};
