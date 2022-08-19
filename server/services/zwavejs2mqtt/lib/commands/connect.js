const logger = require('../../../../utils/logger');

const { DEFAULT } = require('../constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  const externalZwave2Mqtt = await this.gladys.variable.getValue(CONFIGURATION.EXTERNAL_ZWAVE2MQTT, this.serviceId);
  if (externalZwave2Mqtt) {
    this.externalZwave2Mqtt = externalZwave2Mqtt;
  } else {
    this.externalZwave2Mqtt = DEFAULT.EXTERNAL_ZWAVE2MQTT;
    await this.gladys.variable.setValue(CONFIGURATION.EXTERNALZWAVE2MQTT, this.externalZwave2Mqtt, this.serviceId);
  }

  // Test if dongle is present
  this.usbConfigured = false;
  const zwave2mqttDriverPath = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE_DRIVER_PATH, this.serviceId);
  if (!zwave2mqttDriverPath) {
    logger.info(`Zwave2mqtt USB dongle not attached`);
  } else {
    const usb = this.gladys.service.getService('usb');
    const usbList = await usb.list();
    usbList.forEach((usbPort) => {
      if (zwave2mqttDriverPath === usbPort.path) {
        this.usbConfigured = true;
        logger.info(`Zwave2mqtt USB dongle attached to ${zwave2mqttDriverPath}`);
      }
    });
    if (!this.usbConfigured) {
      logger.info(`Zwave2mqtt USB dongle detached to ${zwave2mqttDriverPath}`);
    }
  }

  const dockerBased = await this.gladys.system.isDocker();
  if (!dockerBased && !this.externalZwave2Mqtt) {
    this.dockerBased = false;
    // throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');

    await this.installMqttContainer();
    await this.installZ2mContainer();
  }

  let mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE2MQTT_MQTT_PASSWORD_KEY, this.serviceId);
  if (!mqttPassword) {
    mqttPassword = generate(20, { number: true, lowercase: true, uppercase: true });
    await this.gladys.variable.setValue(
      CONFIGURATION.ZWAVE2MQTT_MQTT_URL_KEY,
      DEFAULT.ZWAVE2MQTT_MQTT_USERNAME_VALUE,
      this.serviceId,
    );
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVE2MQTT_MQTT_PASSWORD_KEY, mqttPassword, this.serviceId);
  }
  this.mqttClient = this.mqtt.connect(DEFAULT.ZWAVE2MQTT_MQTT_URL_VALUE, {
    username: DEFAULT.ZWAVE2MQTT_MQTT_USERNAME_VALUE,
    password: mqttPassword,
    // reconnectPeriod: 5000,
    // clientId: DEFAULT.MQTT_CLIENT_ID,
  });
  this.mqttRunning = this.mqttClient !== null;
  
  if (this.mqttRunning) {
    this.mqttClient.on('connect', () => {
      logger.info('Connected to MQTT container');
      DEFAULT.TOPICS.forEach((topic) => {
        this.mqttClient.subscribe(topic);
      });
      this.mqttConnected = true;
      this.connected = true;
      this.restartRequired = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.MQTT_ERROR,
        payload: err,
      });
      this.mqttConnected = false;
    });

    this.mqttClient.on('offline', () => {
      logger.warn(`Disconnected from MQTT server`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.ERROR,
        payload: 'DISCONNECTED',
      });
      this.mqttConnected = false;
    });

    this.mqttClient.on('message', (topic, message) => {
      try {
        this.handleMqttMessage(topic, message.toString());
      } catch (e) {
        logger.error(`Unable to process message on topic ${topic}: ${e}`);
      }
    });

    this.ready = true;
    this.scanInProgress = true;

    // For testing
    const nodes = require('../../../../../../nodes_wil.json');
    this.handleMqttMessage(
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/driver/driver_ready`,
      '{"data": [{"controllerId":"controllerId","homeId":"homeId"}]}',
    );
    this.handleMqttMessage(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/getNodes`, nodes);

    // this.mqttClient.publish(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVE2MQTT_CLIENT_ID}/api/getNodes/set`, 'true');

    this.driver = {
      controller: {
        ownNodeId: 'N.A.',
      },
    };
  } else {
    logger.warn("Can't connect Gladys cause MQTT not running !");
  }
}

module.exports = {
  connect,
};
