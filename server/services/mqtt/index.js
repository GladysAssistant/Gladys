const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MqttHandler = require('./lib');

const MQTT_URL_KEY = 'MQTT_URL';
const MQTT_USERNAME_KEY = 'MQTT_USERNAME';
const MQTT_PASSWORD_KEY = 'MQTT_PASSWORD';

module.exports = function MqttService(gladys, serviceId) {
  const mqtt = require('mqtt');
  let mqttHandler = null;

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services.mqtt.start();
   */
  async function start() {
    const mqttUrl = await gladys.variable.getValue(MQTT_URL_KEY, serviceId);
    const mqttUsername = await gladys.variable.getValue(MQTT_USERNAME_KEY, serviceId);
    const mqttPassword = await gladys.variable.getValue(MQTT_PASSWORD_KEY, serviceId);
    const variablesFound = mqttUrl;
    if (!variablesFound) {
      throw new ServiceNotConfiguredError('MQTT is not configured.');
    }
    logger.log('starting MQTT service');
    mqttHandler = new MqttHandler(gladys, mqtt, mqttUrl, mqttUsername, mqttPassword, serviceId);
    mqttHandler.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.mqtt.stop();
   */
  async function stop() {
    logger.log('stopping MQTT service');
  }

  return Object.freeze({
    start,
    stop,
    client: mqttHandler,
  });
};
