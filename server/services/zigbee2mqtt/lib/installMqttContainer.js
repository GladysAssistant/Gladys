const cloneDeep = require('lodash.clonedeep');
const path = require('path');
const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { INSTALLATION_PHASE, INSTALLATION_PHASE_STATE } = require('./constants');
const { formatDuration } = require('../utils/formatDuration');
const { hashMosquittoPassword } = require('../utils/hashMosquittoPassword');
const { isImageUpToDate } = require('../utils/isImageUpToDate');
const { addPullEvent, getPullProgress } = require('../utils/getPullProgress');

const containerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');

const { PULL_MQTT, START_MQTT } = INSTALLATION_PHASE;
const { RUNNING, DONE, SKIPPED } = INSTALLATION_PHASE_STATE;

/**
 * @description Install and starts MQTT container.
 * @param {object} config - Service configuration properties.
 * @example
 * await z2m.installMqttContainer(config);
 */
async function installMqttContainer(config) {
  let container;
  try {
    // Throws if the name is taken by a container that is not ours: it is never adopted
    container = await findManagedContainer(this.gladys.system, containerDescriptor);
  } catch (e) {
    this.mqttExist = false;
    // Shown as is by the setup page, so the user reads which container to rename
    this.z2mContainerError = { code: null, message: e.message };
    logger.error('MQTT broker: failed to look up its Docker container:', e);
    this.emitStatusEvent();
    throw e;
  }

  if (!container) {
    let containerMqtt;
    try {
      logger.info('MQTT broker is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      this.updateInstallationPhase(PULL_MQTT, { state: RUNNING });
      const pullStartedAt = Date.now();
      let pullLayers = {};
      const pullOutput = await this.gladys.system.pull(containerDescriptor.Image, (event) => {
        pullLayers = addPullEvent(pullLayers, event);
        this.updateInstallationPhase(PULL_MQTT, { state: RUNNING, progress: getPullProgress(pullLayers) });
      });
      const pullOutcome = isImageUpToDate(pullOutput) ? 'already present' : 'pulled';
      logger.info(`${containerDescriptor.Image} image ${pullOutcome} in ${formatDuration(Date.now() - pullStartedAt)}`);
      this.updateInstallationPhase(PULL_MQTT, { state: DONE });
      this.updateInstallationPhase(START_MQTT, { state: RUNNING });

      // Prepare broker env
      logger.info(`Preparing broker environment...`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);
      const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();

      const mosquittoFolderPath = path.join(basePathOnContainer, '/zigbee2mqtt/mqtt');
      const mosquittoConfigFilePath = path.join(mosquittoFolderPath, 'mosquitto.conf');
      const mosquittoPasswordFilePath = path.join(mosquittoFolderPath, 'mosquitto.passwd');

      logger.info(`Writing Mosquitto config file in ${mosquittoConfigFilePath}`);

      // Ensure that the mosquitto folder exist
      await fse.ensureDir(mosquittoFolderPath);
      const mosquittoConfContent = await fse.readFile(path.join(__dirname, '../docker/mosquitto.conf'));
      await fse.writeFile(mosquittoConfigFilePath, mosquittoConfContent, 'utf-8');
      // Both accounts are written before the container is created, hashed like mosquitto_passwd does: the broker
      // starts once, already configured, instead of being restarted once the accounts are added inside it
      const { z2mMqttUsername, z2mMqttPassword, mqttUsername, mqttPassword } = config;
      const mosquittoPasswordContent = [
        `${z2mMqttUsername}:${hashMosquittoPassword(z2mMqttPassword)}`,
        `${mqttUsername}:${hashMosquittoPassword(mqttPassword)}`,
      ].join('\n');
      await fse.writeFile(mosquittoPasswordFilePath, `${mosquittoPasswordContent}\n`, 'utf-8');

      await containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zigbee2mqtt/mqtt:/mosquitto/config`);

      logger.info(`Creating container with data in "${basePathOnHost}" on host...`);
      const creationStartedAt = Date.now();
      containerMqtt = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.info(`MQTT broker container created in ${formatDuration(Date.now() - creationStartedAt)}`);
      logger.trace(containerMqtt);
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker failed to install as Docker container:', e);
      this.mqttExist = false;
      throw e;
    } finally {
      this.emitStatusEvent();
    }

    try {
      // Created stopped: this is its only start, its configuration and accounts are already written
      logger.info('MQTT broker is starting...');
      const restartStartedAt = Date.now();
      await this.gladys.system.restartContainer(containerMqtt.id);
      logger.info(`MQTT broker container started in ${formatDuration(Date.now() - restartStartedAt)}`);
      await this.waitForBroker(config);
      logger.info('MQTT broker container successfully started and configured');

      this.mqttRunning = true;
      this.mqttExist = true;
      this.updateInstallationPhase(START_MQTT, { state: DONE });
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      throw e;
    } finally {
      this.emitStatusEvent();
    }
  } else {
    this.mqttExist = true;
    this.updateInstallationPhase(PULL_MQTT, { state: SKIPPED });
    try {
      if (container.state !== 'running') {
        logger.info('MQTT broker is starting...');
        this.updateInstallationPhase(START_MQTT, { state: RUNNING });
        const restartStartedAt = Date.now();
        await this.gladys.system.restartContainer(container.id);
        logger.info(`MQTT broker container started in ${formatDuration(Date.now() - restartStartedAt)}`);
        await this.waitForBroker(config);
        this.updateInstallationPhase(START_MQTT, { state: DONE });
      } else {
        this.updateInstallationPhase(START_MQTT, { state: SKIPPED });
      }

      logger.info('MQTT broker container successfully started');
      this.mqttRunning = true;
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      throw e;
    } finally {
      this.emitStatusEvent();
    }
  }
}

module.exports = {
  installMqttContainer,
};
