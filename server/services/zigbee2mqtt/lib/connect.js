const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  
  const driverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
  const usb = this.gladys.service.getService('usb');
  let dongleOK = false;

  if (driverPath) {
    const usbList = await usb.list();
    usbList.forEach( usbPort => {
      if (driverPath === usbPort.path) {
        dongleOK = true;
      }
    });
  }

  if ( dongleOK ) {
    logger.info(`Zigbee2mqtt USB dongle attached to ${driverPath}`);
    this.usbConfigured = true;
  } else {
    logger.info(`Zigbee2mqtt USB dongle not attached`);
    this.usbConfigured = false;
  }

  // Loads MQTT service
  logger.log('starting MQTT service for Zigbee2mqtt');
  // set LAN IP instead of mqtt4z2m for development tests
  this.mqttClient = this.mqttLibrary.connect('mqtt://mqtt4z2m:1883', {
    username: '',
    password: '',
  });
  this.mqttClient.on('connect', () => {
    logger.info('Connected to MQTT container mqtt://mqtt4z2m:1883');
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
    this.subscribe('zigbee2mqtt/#', this.handleMqttMessage.bind(this));
}

module.exports = {
  connect,
};
