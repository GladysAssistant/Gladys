const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible, ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @example
 * init();
 */
async function init() {
  const dockerBased = await this.gladys.system.isDocker();
  if (dockerBased) {
    this.dockerBased = true;
    const networkMode = await this.gladys.system.getNetworkMode();
    if (networkMode !== 'host') {
      this.networkModeValid = false;
      throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
    }
  } else {
    this.dockerBased = false;
  }

  await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', '2', this.serviceId);

  const z2mEnabled = await this.gladys.variable.getValue('ZIGBEE2MQTT_ENABLED', this.serviceId);
  this.z2mEnabled = z2mEnabled !== '0';
  logger.log('Reading z2mEnabled state :', this.z2mEnabled);
  if (z2mEnabled == null) {
    await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', '0', this.serviceId);
    this.z2mEnabled = false;
  } else if (z2mEnabled === '1') {
    this.z2mEnabled = true;

    // Test if dongle is present
    this.usbConfigured = false;
    const zigbee2mqttDriverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
    if (!zigbee2mqttDriverPath) {
      logger.info(`Zigbee2mqtt USB dongle not attached`);
      if (this.z2mEnabled) {
        // await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
        this.z2mEnabled = false;
      }
    } else {
      const usb = this.gladys.service.getService('usb');
      const usbList = await usb.list();
      usbList.forEach((usbPort) => {
        if (zigbee2mqttDriverPath === usbPort.path) {
          this.usbConfigured = true;
          logger.info(`Zigbee2mqtt USB dongle attached to ${zigbee2mqttDriverPath}`);
        }
      });
      if (!this.usbConfigured) {
        logger.info(`Zigbee2mqtt USB dongle detached to ${zigbee2mqttDriverPath}`);
        // await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
        this.z2mEnabled = false;
      }
    }

    // Generate credentials for Gladys & Z2M for connection to broker
    const mqttPw = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
    if (!mqttPw) {
      await this.gladys.variable.setValue(CONFIGURATION.MQTT_URL_KEY, CONFIGURATION.MQTT_URL_VALUE, this.serviceId);
      await this.gladys.variable.setValue(
        CONFIGURATION.Z2M_MQTT_USERNAME_KEY,
        CONFIGURATION.Z2M_MQTT_USERNAME_VALUE,
        this.serviceId,
      );
      await this.gladys.variable.setValue(
        CONFIGURATION.Z2M_MQTT_PASSWORD_KEY,
        generate(20, { number: true, lowercase: true, uppercase: true }),
        this.serviceId,
      );
      await this.gladys.variable.setValue(
        CONFIGURATION.GLADYS_MQTT_USERNAME_KEY,
        CONFIGURATION.GLADYS_MQTT_USERNAME_VALUE,
        this.serviceId,
      );
      await this.gladys.variable.setValue(
        CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY,
        generate(20, { number: true, lowercase: true, uppercase: true }),
        this.serviceId,
      );
      // await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
      this.z2mEnabled = false;
    }

    if (this.usbConfigured) {
      const configuration = await this.getConfiguration();
      if (this.z2mEnabled) {
        await this.connect(configuration);
      }
    }
  } else if (z2mEnabled === '2') {
    // Loads MQTT service
    this.mqttService = this.gladys.service.getService('mqtt');
    if (!this.mqttService.device.configured) {
      throw new ServiceNotConfiguredError('MQTT is not configured.');
    }
    if (!this.mqttService.device.connected) {
      logger.info(`Zigbee2mqtt is starting MQTT service.`);
      this.mqttService.start();
    }
    this.mqttExist = true;
    this.mqttRunning = true;
    this.zigbee2mqttExist = true;
    this.zigbee2mqttRunning = true;
    this.zigbee2mqttConnected = true;
    this.z2mEnabled = true;
    const configuration = await this.getConfiguration();
    await this.connect(configuration);
  }
}

module.exports = {
  init,
};
