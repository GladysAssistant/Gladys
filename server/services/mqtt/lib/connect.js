const logger = require('../../../utils/logger');

/**
 * @description Connect and listen to all topics
 * @example
 * connect();
 */
function connect() {
  logger.debug(`Trying to connect to MQTT server ${this.mqttUrl}...`);
  this.mqttClient = this.mqttLibrary.connect(this.mqttUrl, {
    username: this.mqttUsername,
    password: this.mqttPassword,
  });
  this.mqttClient.on('connect', () => {
    logger.info(`Connected to MQTT server ${this.mqttUrl}`);
    // Gladys master remote
    this.mqttClient.subscribe('gladys/master/#');
    // Owntracks topic
    this.mqttClient.subscribe('owntracks/+/+');
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
