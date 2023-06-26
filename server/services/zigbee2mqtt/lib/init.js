const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await z2m.init();
 */
async function init() {
  const dockerBased = await this.gladys.system.isDocker();
  if (!dockerBased) {
    this.dockerBased = false;
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const networkMode = await this.gladys.system.getNetworkMode();
  if (networkMode !== 'host') {
    this.networkModeValid = false;
    throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
  }

  // Load stored configuration
  const configuration = await this.getConfiguration();
  const { z2mDriverPath, mqttPassword } = configuration;

  // Test if dongle is present
  this.usbConfigured = false;
  if (!z2mDriverPath) {
    logger.info(`Zigbee2mqtt USB dongle not attached`);
  } else {
    const usb = this.gladys.service.getService('usb');
    const usbList = await usb.list();
    const usbPort = usbList.find((usbDriver) => usbDriver.path === z2mDriverPath);

    if (usbPort) {
      logger.info(`Zigbee2mqtt USB dongle attached to ${z2mDriverPath}`);
      this.usbConfigured = true;
    } else {
      logger.warn(`Zigbee2mqtt USB dongle detached to ${z2mDriverPath}`);
      this.usbConfigured = false;
    }
  }

  // Check for existing credentials for Gladys & Z2M for connection to broker
  if (!mqttPassword) {
    configuration.mqttUrl = CONFIGURATION.MQTT_URL_VALUE;
    configuration.z2mMqttUsername = CONFIGURATION.Z2M_MQTT_USERNAME_VALUE;
    configuration.z2mMqttPassword = generate(20, {
      number: true,
      lowercase: true,
      uppercase: true,
    });
    configuration.mqttUsername = CONFIGURATION.GLADYS_MQTT_USERNAME_VALUE;
    configuration.mqttPassword = generate(20, {
      number: true,
      lowercase: true,
      uppercase: true,
    });
  }

  if (this.usbConfigured) {
    logger.debug('Zibgee2mqtt: installing and starting required docker containers...');
    await this.checkForContainerUpdates(configuration);
    await this.installMqttContainer(configuration);
    await this.installZ2mContainer(configuration);

    if (this.isEnabled()) {
      await this.connect(configuration);

      // Schedule reccurent job if not already scheduled
      if (!this.backupScheduledJob) {
        this.backupScheduledJob = this.gladys.scheduler.scheduleJob('0 0 23 * * *', () => this.backup());
      }
    }
  }

  await this.saveConfiguration(configuration);

  return null;
}

module.exports = {
  init,
};
