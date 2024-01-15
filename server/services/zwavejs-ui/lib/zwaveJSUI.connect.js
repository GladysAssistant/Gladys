const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { CONFIGURATION } = require('./constants');

/**
 * @description This function will connect to the MQTT broker.
 * @example zwaveJSUI.connect();
 */
async function connect() {
  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJS_UI_MQTT_PASSWORD_KEY, this.serviceId);
  if (!mqttUrl) {
    this.configured = false;
    throw new ServiceNotConfiguredError('MQTT is not configured.');
  }
  this.configured = true;
  logger.info(`Trying to connect to MQTT server ${mqttUrl}...`);
  this.mqttClient = this.mqttLibrary.connect(mqttUrl, {
    username: mqttUsername,
    password: mqttPassword,
    reconnectPeriod: 5000,
    clientId: `gladys-main-instance-zwavejs-ui-${Math.floor(Math.random() * 1000000)}`,
  });

  this.mqttClient.on('connect', async () => {
    logger.info(`Connected to MQTT server ${mqttUrl}`);

    await this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.CONNECTED,
    });

    this.mqttClient.subscribe('zwave/#');
    this.connected = true;
    this.scan();
  });
  this.mqttClient.on('error', async (err) => {
    logger.warn(`Error while connecting to MQTT - ${err}`);

    await this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR,
      payload: err,
    });

    this.disconnect();
  });
  this.mqttClient.on('offline', async () => {
    logger.warn(`Disconnected from MQTT server`);
    await this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.ERROR,
      payload: 'DISCONNECTED',
    });
    this.connected = false;
  });
  this.mqttClient.on('message', async (topic, message) => {
    await this.handleNewMessage(topic, message.toString());
  });
}

module.exports = {
  connect,
};
