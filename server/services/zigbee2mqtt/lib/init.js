const logger = require('../../../utils/logger');
const {
  CONFIGURATION,
  MQTT_MODE,
  ADAPTER_MODE,
  DEFAULT,
  INSTALLATION_STATE,
  INSTALLATION_KIND,
} = require('./constants');
const { generate } = require('../../../utils/password');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { findOwnContainer } = require('../../../utils/dockerContainers');
const { formatDuration } = require('../utils/formatDuration');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Tell whether a container that Gladys runs already is replaced by a new version (see
 * checkForContainerUpdates): not on a first installation, whose containers do not exist yet.
 * @param {object} system - Gladys system module.
 * @param {object} config - Service configuration properties.
 * @returns {Promise<boolean>} Resolve with true when an existing container is replaced.
 * @example
 * const updateRequired = await isUpdateRequired(this.gladys.system, configuration);
 */
async function isUpdateRequired(system, config) {
  const outdatedDescriptors = [];
  if (config.dockerMqttVersion !== DEFAULT.DOCKER_MQTT_VERSION) {
    outdatedDescriptors.push(mqttContainerDescriptor);
  }
  if (config.dockerZ2mVersion !== DEFAULT.DOCKER_Z2M_VERSION) {
    outdatedDescriptors.push(z2mContainerDescriptor);
  }
  // Not ours, a container is not replaced: checkForContainerUpdates fails, and tells why
  const containers = await Promise.all(outdatedDescriptors.map((descriptor) => findOwnContainer(system, descriptor)));
  return containers.some((container) => container !== null);
}

/**
 * @description Tell the outcome of an update once Zigbee2mqtt answers, or fails to.
 * @param {object} manager - Zigbee2mqtt manager.
 * @returns {Promise} Resolve once the outcome is told, never rejects: nobody waits for it.
 * @example
 * finishUpdate(this);
 */
async function finishUpdate(manager) {
  try {
    await manager.waitForZigbee2mqtt();
  } catch (e) {
    logger.error('Zigbee2mqtt: update failed:', e);
    manager.finishInstallation(e);
    return;
  }
  manager.finishInstallation(null);
}

/**
 * @description Prepares service and starts connection with broker if needed.
 * @param {boolean} setupMode - In setup mode.
 * @returns {Promise} Resolve when init finished.
 * @example
 * await z2m.init();
 */
async function init(setupMode = false) {
  const startedAt = Date.now();
  // Reset status
  this.usbConfigured = false;
  this.networkAdapterConfigured = false;
  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttContainerRunning = false;
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;
  clearTimeout(this.healthCheckTimer);
  this.healthCheckTimer = null;
  clearTimeout(this.startingTimer);
  this.startingTimer = null;
  this.zigbee2mqttStarting = false;
  this.z2mPermitJoin = false;
  this.networkModeValid = false;
  this.z2mContainerError = null;
  this.ezspFallback = false;
  this.mqttConnectionError = null;
  this.dockerBased = false;

  // Load stored configuration
  const configuration = await this.getConfiguration();
  const { z2mDriverPath, mqttPassword, mqttMode, mqttUrl, z2mAdapterMode, z2mNetworkAdapterUrl } = configuration;

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

  // Test if the coordinator is usable: a USB dongle is checked against the ports actually plugged in,
  // while a network coordinator is only checked for being configured. Its reachability is not probed
  // here, as a TCP test on every start could hang; if it is down, Zigbee2mqtt will keep restarting.
  this.usbConfigured = false;
  this.networkAdapterConfigured = false;
  if (z2mAdapterMode === ADAPTER_MODE.NETWORK) {
    if (z2mNetworkAdapterUrl) {
      logger.info(
        `Zigbee2mqtt network coordinator configured on ${z2mNetworkAdapterUrl} (reachability is not verified)`,
      );
      this.networkAdapterConfigured = true;
    } else {
      logger.info(`Zigbee2mqtt network coordinator not configured`);
    }
  } else if (!z2mDriverPath) {
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

  let updating = false;
  try {
    if (this.usbConfigured || this.networkAdapterConfigured) {
      logger.debug('Zibgee2mqtt: installing and starting required docker containers...');
      // We force set the mqttMode to local for existing instances
      configuration.mqttMode = MQTT_MODE.LOCAL;

      // The replacement of the containers by a new version is followed by the setup page like an installation, from
      // the download of the new images. Unless an installation runs: it follows this init already.
      const updateRequired =
        this.installation.state !== INSTALLATION_STATE.RUNNING &&
        (await isUpdateRequired(this.gladys.system, configuration));
      // Checked again once the containers are found: a setup sent meanwhile started an installation, which would
      // refuse this one and fail the start of the service
      if (updateRequired && this.installation.state !== INSTALLATION_STATE.RUNNING) {
        this.startInstallation(INSTALLATION_KIND.UPDATE);
        updating = true;
      }

      // Before any container is replaced: a container replaced by a new version keeps running during the download
      let newImagesPulled = true;
      try {
        await this.pullMissingImages();
      } catch (e) {
        if (updating) {
          // Without the new images (no Internet, registry down), the running containers are kept and Gladys connects
          // to them: the update is tried again on the next start, instead of leaving Gladys without Zigbee until then
          logger.warn('Zigbee2mqtt: new images not downloaded, the update is postponed to the next start:', e);
          this.finishInstallation(e);
          updating = false;
          newImagesPulled = false;
        } else {
          // Only a container to create needs its image, and downloads it again then: running containers whose image
          // tag left the machine (removed by hand) keep running, Gladys connects to them
          logger.warn('Zigbee2mqtt: images not downloaded ahead, going on with the containers in place:', e);
        }
      }
      // Skipped, the stored versions stay the old ones
      if (newImagesPulled) {
        await this.checkForContainerUpdates(configuration);
      }
      await this.installMqttContainer(configuration);
      await this.installZ2mContainer(configuration, setupMode);

      // Connect as soon as the broker runs, without waiting for Zigbee2mqtt to be online: Gladys asks it
      // through the broker whether it runs (health check).
      if (this.mqttRunning) {
        await this.connect(configuration);

        // Schedule reccurent job if not already scheduled
        if (!this.backupScheduledJob) {
          this.backupScheduledJob = this.gladys.scheduler.scheduleJob('0 0 23 * * *', () => this.backup());
        }
      }
      logger.info(`Zigbee2mqtt: containers installed and started in ${formatDuration(Date.now() - startedAt)}`);
    } else if (configuration.mqttMode === MQTT_MODE.EXTERNAL) {
      await this.connect(configuration);
    }

    await this.saveConfiguration(configuration);
  } catch (e) {
    if (updating) {
      logger.error('Zigbee2mqtt: update failed:', e);
      this.finishInstallation(e);
    }
    throw e;
  }

  if (updating) {
    // Not awaited: the service starts without waiting for Zigbee2mqtt to answer
    finishUpdate(this);
  }

  return null;
}

module.exports = {
  init,
};
