const crypto = require('crypto');
const logger = require('../../../../utils/logger');

const { DEFAULT, CONFIGURATION } = require('../constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');
const { generate } = require('../../../../utils/password');

/**
 * @description Initialize service with dependencies and connect to devices.
 * @example
 * connect();
 */
async function connect() {
  const externalZwaveJSUIStr = await this.gladys.variable.getValue(CONFIGURATION.EXTERNAL_ZWAVEJSUI, this.serviceId);
  let externalZwaveJSUI;
  if (externalZwaveJSUIStr) {
    externalZwaveJSUI = externalZwaveJSUIStr === '1';
  } else {
    externalZwaveJSUI = DEFAULT.EXTERNAL_ZWAVEJSUI;

    await this.gladys.variable.setValue(
      CONFIGURATION.EXTERNAL_ZWAVEJSUI,
      externalZwaveJSUI ? '1' : '0',
      this.serviceId,
    );
  }

  let mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, this.serviceId);

  // Test if dongle is present
  this.usbConfigured = false;
  if (externalZwaveJSUI) {
    logger.info(`ZwaveJS UI USB dongle assumed to be attached`);
    this.usbConfigured = true;
    this.driverPath = 'N.A.';
    this.mqttExist = true;
    this.zwaveJSUIExist = true;
    this.mqttRunning = true;
    this.zwaveJSUIRunning = true;
  } else {
    // MQTT configuration
    if (!mqttPassword) {
      // First start, use default value for MQTT
      const mqttUrl = DEFAULT.ZWAVEJSUI_MQTT_URL_VALUE;
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_URL, mqttUrl, this.serviceId);
      const mqttUsername = DEFAULT.ZWAVEJSUI_MQTT_USERNAME_VALUE;
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, mqttUsername, this.serviceId);
      mqttPassword = generate(20, { number: true, lowercase: true, uppercase: true });
      await this.gladys.variable.setValue(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, mqttPassword, this.serviceId);
      // Keep copy in case switch between external/gladys ZwaveJS UI
      await this.gladys.variable.setValue(CONFIGURATION.DEFAULT_ZWAVEJSUI_MQTT_PASSWORD, mqttPassword, this.serviceId);
    }

    const driverPath = await this.gladys.variable.getValue(CONFIGURATION.DRIVER_PATH, this.serviceId);
    if (driverPath) {
      const usb = this.gladys.service.getService('usb');
      const usbList = await usb.list();
      usbList.forEach((usbPort) => {
        if (driverPath === usbPort.path) {
          this.usbConfigured = true;
          logger.info(`ZwaveJS UI USB dongle attached to ${driverPath}`);
        }
      });
      if (!this.usbConfigured) {
        logger.info(`ZwaveJS UI USB dongle detached to ${driverPath}`);
      }
    } else {
      logger.info(`ZwaveJSUI USB dongle not attached`);
    }

    if (this.usbConfigured) {
      // Security keys configuration
      let s2UnauthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_UNAUTHENTICATED, this.serviceId);
      if (!s2UnauthenticatedKey) {
        s2UnauthenticatedKey = crypto.randomBytes(16).toString('hex');
        await this.gladys.variable.setValue(CONFIGURATION.S2_UNAUTHENTICATED, s2UnauthenticatedKey, this.serviceId);
      }
      let s2AuthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_AUTHENTICATED, this.serviceId);
      if (!s2AuthenticatedKey) {
        s2AuthenticatedKey = crypto.randomBytes(16).toString('hex');
        await this.gladys.variable.setValue(CONFIGURATION.S2_AUTHENTICATED, s2AuthenticatedKey, this.serviceId);
      }
      let s2AccessControlKey = await this.gladys.variable.getValue(CONFIGURATION.S2_ACCESS_CONTROL, this.serviceId);
      if (!s2AccessControlKey) {
        s2AccessControlKey = crypto.randomBytes(16).toString('hex');
        await this.gladys.variable.setValue(CONFIGURATION.S2_ACCESS_CONTROL, s2AccessControlKey, this.serviceId);
      }
      let s0LegacyKey = await this.gladys.variable.getValue(CONFIGURATION.S0_LEGACY, this.serviceId);
      if (!s0LegacyKey) {
        s0LegacyKey = crypto.randomBytes(16).toString('hex');
        await this.gladys.variable.setValue(CONFIGURATION.S0_LEGACY, s0LegacyKey, this.serviceId);
      }

      this.dockerBased = await this.gladys.system.isDocker();
      if (this.dockerBased) {
        await this.installMqttContainer();
        if (this.usbConfigured) {
          await this.installZwaveJSUIContainer();
        }
      } else {
        this.mqttExist = true;
        this.mqttRunning = true;
        this.zwaveJSUIExist = true;
        this.zwaveJSUIRunning = true;
      }
    }
  }

  this.mqttTopicPrefix = DEFAULT.ZWAVEJSUI_MQTT_TOPIC_PREFIX;
  this.mqttTopicWithLocation = false;
  if (externalZwaveJSUI) {
    const storedMqttTopicPrefix = await this.gladys.variable.getValue(
      CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX,
      this.serviceId,
    );
    if (storedMqttTopicPrefix) {
      this.mqttTopicPrefix = storedMqttTopicPrefix;
    } else {
      await this.gladys.variable.setValue(
        CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX,
        this.mqttTopicPrefix,
        this.serviceId,
      );
    }
    const mqttTopicWithLocationStr = await this.gladys.variable.getValue(
      CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION,
      this.serviceId,
    );
    this.mqttTopicWithLocation = mqttTopicWithLocationStr === '1';
  } else {
    await this.gladys.variable.setValue(
      CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX,
      this.mqttTopicPrefix,
      this.serviceId,
    );
  }

  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_URL, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, this.serviceId);
  if (this.mqttRunning) {
    const options = {
      // reconnectPeriod: 5000,
      // clientId: DEFAULT.MQTT_CLIENT_ID,
    };
    if (mqttUsername && mqttPassword) {
      options.username = mqttUsername;
      options.password = mqttPassword;
    }
    this.mqttClient = this.mqtt.connect(mqttUrl, options);

    this.mqttClient.on('connect', () => {
      logger.info('Connected to MQTT container');
      this.mqttClient.subscribe(`${this.mqttTopicPrefix}/#`);
      logger.info(`Listening to MQTT topics ${this.mqttTopicPrefix}/#`);
      this.mqttConnected = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
    });

    this.mqttClient.on('error', (err) => {
      logger.warn(`Error while connecting to MQTT - ${err}`);
      if (err.code === 5 || err.code === 'ECONNREFUSED') {
        // Connection refused: Not authorized
        this.disconnect();
      }
      this.mqttConnected = false;
      this.scanInProgress = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.MQTT_ERROR,
        payload: err,
      });
    });

    this.mqttClient.on('offline', () => {
      logger.warn(`Disconnected from MQTT server`);
      this.mqttConnected = false;
      this.scanInProgress = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.MQTT_ERROR,
        payload: 'DISCONNECTED',
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      try {
        this.mqttConnected = true;
        this.handleMqttMessage(topic, message.toString());
      } catch (e) {
        logger.error(`Unable to process message on topic ${topic}: ${e}`);
      }
    });

    this.scanNetwork();
  } else {
    logger.warn("Can't connect Gladys cause MQTT not running !");
  }
}

module.exports = {
  connect,
};
