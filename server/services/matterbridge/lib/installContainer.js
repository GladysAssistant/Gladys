const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');

const path = require('path');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const containerDescriptor = require('../docker/gladys-matterbridge-container.json');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { DEFAULT } = require('./constants');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Matterbridge container.
 * @param {object} config - Service configuration properties.
 * @example
 * await matterbridge.installContainer(config);
 */
async function installContainer(config) {
  if (!(await this.isEnabled())) {
    logger.info('Matterbridge: is not enabled, skipping...');
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
      logger.info('Matterbridge: is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      // Prepare container env
      logger.info(`Matterbridge: Preparing environment...`);
      await this.configureContainer(config);

      logger.info(`Creation of container...`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      const matterbridgePath = path.join(basePathOnHost, DEFAULT.CONFIGURATION_PATH);

      containerDescriptorToMutate.HostConfig.Binds = [
        `${matterbridgePath}/Matterbridge:/root/Matterbridge`,
        `${matterbridgePath}/.matterbridge:/root/.matterbridge`,
        `${matterbridgePath}/.mattercert:/root/.mattercert`,
      ];

      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);

      logger.info('Matterbridge: successfully installed and configured as Docker container');
      this.matterbridgeExist = true;
    } catch (e) {
      this.matterbridgeExist = false;
      logger.error('Matterbridge: failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
      });
      throw e;
    }
  }

  await this.configureContainer(config);

  try {
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;

    // Check if we need to restart the container (container is not running)
    if (container.state !== 'running') {
      logger.info('Matterbridge: container is (re)starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait a few seconds for the container to restart
      await sleep(this.containerRestartWaitTimeInMs);
    }

    logger.info('Matterbridge: container successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    this.matterbridgeRunning = true;
    this.matterbridgeExist = true;
  } catch (e) {
    logger.error('Matterbridge: container failed to start:', e);
    this.matterbridgeRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    throw e;
  }
}

module.exports = {
  installContainer,
};
