const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');

const path = require('path');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const containerDescriptor = require('../docker/gladys-node-red-container.json');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { DEFAULT } = require('./constants');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Node-RED container.
 * @param {object} config - Service configuration properties.
 * @example
 * await nodeRed.installContainer(config);
 */
async function installContainer(config) {
  if (!(await this.isEnabled())) {
    logger.info('Nodered: is not enabled, skipping...');
    return;
  }

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

  const { basePathOnHost } = await this.gladys.system.getGladysBasePath();

  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    try {
      logger.info('Nodered: is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      // Prepare broker env
      logger.info(`Nodered: Preparing environment...`);
      await this.configureContainer(config);

      logger.info(`Creation of container...`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      const configFilepath = path.join(basePathOnHost, path.dirname(DEFAULT.CONFIGURATION_PATH));

      containerDescriptorToMutate.HostConfig.Binds = [`${configFilepath}:/data`];

      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);

      logger.info('Node-RED: successfully installed and configured as Docker container');
      this.nodeRedExist = true;
    } catch (e) {
      this.nodeRedExist = false;
      logger.error('Node-RED: failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
      });
      throw e;
    }
  }

  const configChanged = await this.configureContainer(config);

  try {
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;

    // Check if we need to restart the container (container is not running / config changed)
    if (container.state !== 'running' || configChanged) {
      logger.info('Node-RED: container is (re)starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait a few seconds for the container to restart
      await sleep(this.containerRestartWaitTimeInMs);
    }

    logger.info('Node-RED: container successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    this.nodeRedRunning = true;
    this.nodeRedExist = true;
  } catch (e) {
    logger.error('Node-RED: container failed to start:', e);
    this.nodeRedRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    throw e;
  }
}

module.exports = {
  installContainer,
};
