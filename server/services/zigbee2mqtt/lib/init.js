const logger = require('../../../utils/logger');
const { CONFIGURATION, MQTT_MODE } = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @param {boolean} setupMode - In setup mode.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await z2m.init();
 */
async function init(setupMode = false) {
  // Reset status
  this.usbConfigured = false;
  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttContainerRunning = false;
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;
  this.z2mPermitJoin = false;
  this.networkModeValid = false;
  this.dockerBased = false;

  // Load stored configuration
  const configuration = await this.getConfiguration();
  const { z2mDriverPath, mqttPassword, mqttMode, mqttUrl } = configuration;

  try {
    const dockerBased = await this.gladys.system.isDocker();
    if (!dockerBased) {
      throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
    }
    this.dockerBased = true;
    this.emitStatusEvent();

    const networkMode = await this.gladys.system.getNetworkMode();
    if (networkMode !== 'host') {
      throw new PlatformNotCompatible('DOCKER_BAD_NETWORK');
    }
  } catch (e) {
    logger.debug(e);
    if (mqttMode !== MQTT_MODE.EXTERNAL) {
      throw e;
    }
  }

  this.networkModeValid = true;
  this.emitStatusEvent();

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

  this.emitStatusEvent();

  if (mqttMode === MQTT_MODE.LOCAL) {
    // Check for existing credentials for Gladys
    if (!mqttPassword) {
      configuration.mqttUsername = CONFIGURATION.GLADYS_MQTT_USERNAME_VALUE;
      configuration.mqttPassword = generate(20, {
        number: true,
        lowercase: true,
        uppercase: true,
      });
    }
    // Verify that mqttUrl is present
    if (!mqttUrl) {
      configuration.mqttUrl = CONFIGURATION.MQTT_URL_VALUE;
    }
    // Check for existing credentials for Z2M
    if (!configuration.z2mMqttPassword) {
      configuration.z2mMqttUsername = CONFIGURATION.Z2M_MQTT_USERNAME_VALUE;
      configuration.z2mMqttPassword = generate(20, {
        number: true,
        lowercase: true,
        uppercase: true,
      });
    }
  }

  if (this.usbConfigured) {
    logger.debug('Zibgee2mqtt: installing and starting required docker containers...');
    // We force set the mqttMode to local for existing instances
    configuration.mqttMode = MQTT_MODE.LOCAL;

    await this.checkForContainerUpdates(configuration);
    await this.installMqttContainer(configuration);
    await this.installZ2mContainer(configuration, setupMode);

    if (this.isEnabled()) {
      await this.connect(configuration);

      // Schedule reccurent job if not already scheduled
      if (!this.backupScheduledJob) {
        this.backupScheduledJob = this.gladys.scheduler.scheduleJob('0 0 23 * * *', () => this.backup());
      }
    }
  } else if (configuration.mqttMode === MQTT_MODE.EXTERNAL) {
    await this.connect(configuration);
  }

  await this.saveConfiguration(configuration);

  return null;
}

module.exports = {
  init,
};
