const logger = require('../../../utils/logger');
const { CONFIGURATION, DEFAULT } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible, ServiceNotConfiguredError } = require('../../../utils/coreErrors');

async function startZwaveJS() {
  const zwaveDriverPath = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE_DRIVER_PATH, this.serviceId);
  if (!zwaveDriverPath) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_PATH_NOT_FOUND');
  }
  const s2Unauthenticated = await this.gladys.variable.getValue(CONFIGURATION.S2_UNAUTHENTICATED, this.serviceId);
  const s2Authenticated = await this.gladys.variable.getValue(CONFIGURATION.S2_AUTHENTICATED, this.serviceId);
  const s2AccessControl = await this.gladys.variable.getValue(CONFIGURATION.S2_ACCESS_CONTROL, this.serviceId);
  const s0Legacy = await this.gladys.variable.getValue(CONFIGURATION.S0_LEGACY, this.serviceId);
  const securityKeys = {};
  if (s2Unauthenticated) {
    securityKeys.S2_Unauthenticated = Buffer.from(s2Unauthenticated, 'hex');
  }
  if (s2Authenticated) {
    securityKeys.S2_Authenticated = Buffer.from(s2Authenticated, 'hex');
  }
  if (s2AccessControl) {
    securityKeys.S2_AccessControl = Buffer.from(s2AccessControl, 'hex');
  }
  if (s0Legacy) {
    securityKeys.S0_Legacy = Buffer.from(s0Legacy, 'hex');
  }
  await this.connectZwaveJS(zwaveDriverPath, securityKeys);
}

async function startMqtt() {
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
    //reconnectPeriod: 5000,
    //clientId: DEFAULT.MQTT_CLIENT_ID,
  });
  this.mqttRunning = this.mqttClient !== null;
  await this.connectZwave2mqtt();
}

/**
 * @description Prepares service and starts connection with broker if needed.
 * @example
 * connect();
 */
async function connect() {
  const zwaveMode = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEMODE, this.serviceId);
  if (zwaveMode) {
    this.zwaveMode = zwaveMode;
  } else {
    this.zwaveMode = DEFAULT.MODE_ZWAVE2MQTT;
    await this.gladys.variable.setValue(CONFIGURATION.ZWAVEMODE, this.zwaveMode, this.serviceId);
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
  if (!dockerBased && this.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT) {
    this.dockerBased = false;
    // throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');

    await this.installMqttContainer();
    await this.installZ2mContainer();
  }

  if (this.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT) {
    startMqtt.call(this);
  } else {
    startZwaveJS.call(this);
  }
}

module.exports = {
  connect,
};
