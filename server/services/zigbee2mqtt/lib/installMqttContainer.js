const cloneDeep = require('lodash.clonedeep');
const path = require('path');
const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { INSTALLATION_STATE, INSTALLATION_KIND, INSTALLATION_PHASE, INSTALLATION_PHASE_STATE } = require('./constants');
const { formatDuration } = require('../utils/formatDuration');
const { hashMosquittoPassword } = require('../utils/hashMosquittoPassword');
const { BROKER_MAX_WAIT_IN_MS } = require('./waitForBroker');

const containerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');

const { PULL_MQTT, START_MQTT } = INSTALLATION_PHASE;
const { RUNNING, DONE, SKIPPED } = INSTALLATION_PHASE_STATE;

/**
 * @description Wait for the broker just started to answer, and only then show its phase done. An installation launched
 * from the setup page fails when it does not: its phase would show the broker started, and the installation would fail
 * later on a less clear error. At the start of Gladys or during an update, Gladys goes on as before: its client
 * connects once the broker answers.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {object} config - Service configuration properties.
 * @returns {Promise} Resolve once the broker answers, or after the maximum wait outside such an installation.
 * @example
 * await waitForStartedBroker(this, config);
 */
async function waitForStartedBroker(manager, config) {
  const brokerAnswered = await manager.waitForBroker(config);
  if (brokerAnswered) {
    manager.updateInstallationPhase(START_MQTT, { state: DONE });
    return;
  }
  const { state, kind } = manager.installation;
  const launchedFromSetupPage =
    state === INSTALLATION_STATE.RUNNING && (kind === INSTALLATION_KIND.INSTALL || kind === INSTALLATION_KIND.SWITCH);
  if (launchedFromSetupPage) {
    throw new Error(`MQTT broker did not answer within ${formatDuration(BROKER_MAX_WAIT_IN_MS)}`);
  }
  // The phase of an update stays running while Gladys goes on: shown as the one that failed if the update fails later,
  // rather than a broker shown started that never answered
}

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
      await this.pullImage(containerDescriptor.Image);
      // Done once downloaded, maybe before by init (see pullImage): skipped when the image was there already
      this.updateInstallationPhase(PULL_MQTT, { state: SKIPPED });
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
      await waitForStartedBroker(this, config);
      logger.info('MQTT broker container successfully started and configured');

      this.mqttRunning = true;
      this.mqttExist = true;
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
        await waitForStartedBroker(this, config);
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
