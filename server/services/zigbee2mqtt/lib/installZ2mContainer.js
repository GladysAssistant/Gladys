const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');

const logger = require('../../../utils/logger');

const containerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Zigbee2mqtt container.
 * @param {object} config - Service configuration properties.
 * @param {boolean} setupMode - In setup mode.
 * @example
 * await z2m.installZ2mContainer(config);
 */
async function installZ2mContainer(config, setupMode = false) {
  const { z2mDriverPath } = config;
  let creationNeeded = false;

  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  /*
   * Manage case where Zigbee USB Dongle Path has changed by removing the container.
   * It will be created with good config later
   */
  if (dockerContainers.length > 0) {
    const containerDescription = await this.gladys.system.inspectContainer(container.id);
    if (containerDescription.HostConfig.Devices[0].PathOnHost !== z2mDriverPath) {
      logger.info(
        `Zigbee2mqtt container with USB dongle path ${containerDescription.HostConfig.Devices[0].PathOnHost} should be removed (new USB dongle path ${z2mDriverPath} configured)...`,
      );
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);
      creationNeeded = true;
    }
  }

  const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
  const containerPath = `${basePathOnHost}/zigbee2mqtt/z2m`;
  if (dockerContainers.length === 0 || creationNeeded) {
    // Restore backup only in case of new installation
    await this.restoreZ2mBackup(containerPath);

    try {
      logger.info('Zigbee2mqtt is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      logger.info(`Configuration of Device ${z2mDriverPath}`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);
      containerDescriptorToMutate.HostConfig.Binds.push(`${containerPath}:/app/data`);
      containerDescriptorToMutate.HostConfig.Devices[0].PathOnHost = z2mDriverPath;

      logger.info(`Creation of container...`);
      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);
      logger.info('Zigbee2mqtt successfully installed and configured as Docker container');
      this.zigbee2mqttExist = true;
    } catch (e) {
      this.zigbee2mqttExist = false;
      logger.error('Zigbee2mqtt failed to install as Docker container:', e);
      throw e;
    } finally {
      this.emitStatusEvent();
    }
  }

  const configChanged = await this.configureContainer(basePathOnContainer, config, setupMode);

  try {
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;

    // Check if we need to restart the container (container is not running / config changed)
    if (container.state !== 'running' || configChanged) {
      logger.info('Zigbee2mqtt container is (re)starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait a few seconds for the container to restart
      await sleep(this.containerRestartWaitTimeInMs);
    }

    logger.info('Zigbee2mqtt container successfully started');
    this.zigbee2mqttRunning = true;
    this.zigbee2mqttExist = true;
  } catch (e) {
    logger.error('Zigbee2mqtt container failed to start:', e);
    this.zigbee2mqttRunning = false;
    throw e;
  } finally {
    this.emitStatusEvent();
  }
}

module.exports = {
  installZ2mContainer,
};
