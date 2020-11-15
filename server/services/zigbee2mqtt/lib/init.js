const logger = require('../../../utils/logger');
const { DEFAULT, CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
const { ServiceNotConfiguredError, PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function init() {

  const dockerBased = await this.gladys.system.isDocker();
  if (!dockerBased) {
    this.dockerBased = false;
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

//  const networkMode = await this.gladys.system.getNetworkMode();
  // For testing
  const networkMode = 'host';
  if (networkMode !== 'host') {
    this.networkModeValid = false;
    throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
  }

  const z2mEnabled = await this.gladys.variable.getValue('ZIGBEE2MQTT_ENABLED', this.serviceId);
  this.z2mEnabled = z2mEnabled !== '0';
  logger.log("Reading z2mEnabled state :", this.z2mEnabled)
  if ( z2mEnabled == null) {
    await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
    this.z2mEnabled = false;
  }

  // Test if dongle is present
  this.usbConfigured = false;
  const zigbee2mqttDriverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
  if (!zigbee2mqttDriverPath) {
    logger.info(`Zigbee2mqtt USB dongle not attached`);
    if (this.z2mEnabled) {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
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
      if (this.z2mEnabled) {
        await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
        this.z2mEnabled = false;
      }
    }
  }
//  if (!this.usbConfigured) {
//    throw new ServiceNotConfiguredError('ZIGBEE2MQTT_DRIVER_PATH_NOT_FOUND');
//  }

  // Generate credentials for Gladys & Z2M for connection to broker
  const mqttPw = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
  if (!mqttPw) {
    await this.gladys.variable.setValue(CONFIGURATION.MQTT_URL_KEY, CONFIGURATION.MQTT_URL_VALUE, this.serviceId);
    await this.gladys.variable.setValue(
      CONFIGURATION.Z2M_MQTT_USERNAME_KEY,
      CONFIGURATION.Z2M_MQTT_USERNAME_VALUE,
      this.serviceId,
    );
    await this.gladys.variable.setValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, generate(), this.serviceId);
    await this.gladys.variable.setValue(
      CONFIGURATION.GLADYS_MQTT_USERNAME_KEY,
      CONFIGURATION.GLADYS_MQTT_USERNAME_VALUE,
      this.serviceId,
    );
    await this.gladys.variable.setValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, generate(), this.serviceId);
    await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
  }
  
  if (this.usbConfigured) {
    const configuration = await this.getConfiguration();
    if (this.z2mEnabled) {
      await this.connect(configuration);
    }  
  }
}

module.exports = {
  init,
};
