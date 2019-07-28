const logger = require('../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('./constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Connect and listen to all topics
 * @example
 * connect('htpp://localhost:1883', 'mqttUser', 'mqttPassword');
 */
async function connect() {
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.MQTT_PASSWORD_KEY, this.serviceId);
  const mqttTopics = await this.gladys.variable.getValue(CONFIGURATION.MQTT_TOPICS_KEY, this.serviceId);
  const variablesFound = mqttUrl;
  if (!variablesFound) {
    throw new ServiceNotConfiguredError('MQTT is not configured.');
  }

  if (this.mqttClient) {
    this.disconnect();
  }

  logger.debug(`Trying to connect to MQTT server ${mqttUrl}...`);
  this.mqttClient = this.mqttLibrary.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
  });
  this.mqttClient.on('connect', () => {
    logger.info(`Connected to MQTT server ${mqttUrl}`);

    DEFAULT.TOPICS.forEach((topic) => {
      logger.info(`Subscribing to default MQTT topic ${topic}`);
      this.mqttClient.subscribe(topic);
    });

    (mqttTopics || '').split(',').forEach((topic) => {
      logger.info(`Subscribing to customized MQTT topic ${topic}`);
      this.mqttClient.subscribe(topic);
    });
  });
  this.mqttClient.on('error', (err) => {
    logger.warn(`Error while connecting to MQTT - ${err}`);
  });
  this.mqttClient.on('message', (topic, message) => {
    this.handleNewMessage(topic, message.toString());
  });
}

module.exports = {
  connect,
};
