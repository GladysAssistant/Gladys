const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');
const { exec } = require('../../../../utils/childProcess');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../../docker/gladys-zwavejsui-zwavejsui-container.json');
const logger = require('../../../../utils/logger');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts ZwaveJSUI container.
 * @example
 * installZ2mContainer();
 */
async function installZ2mContainer() {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0 || (container && container.state === 'created')) {
    if (container && container.state === 'created') {
      await this.gladys.system.removeContainer(container.id);
    }

    try {
      logger.info('ZwaveJSUI is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      // Prepare Z2M env
      logger.info(`Preparing ZwaveJSUI environment...`);
      const { basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const brokerEnv = await exec(
        `sh ./services/zwave-js-ui/docker/gladys-zwavejsui-zwavejsui-env.sh ${basePathOnHost} ${this.mqttUsername} "${this.mqttPassword}" ${this.driverPath} "${this.s2UnauthenticatedKey}" "${this.s2AuthenticatedKey}" "${this.s2AccessControlKey}" "${this.s0LegacyKey}"`,
      );
      logger.trace(brokerEnv);
      containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zwave-js-ui:/usr/src/app/store`);

      containerDescriptorToMutate.HostConfig.Devices[0].PathOnHost = this.driverPath;

      logger.info(`Creation of container...`);
      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);
      logger.info('ZwaveJSUI successfully installed and configured as Docker container');
      this.zwaveJSUIExist = true;
    } catch (e) {
      this.zwaveJSUIExist = false;
      logger.error('ZwaveJSUI failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      throw e;
    }
  }

  try {
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;
    if (container.state !== 'running') {
      logger.info('ZwaveJSUI container is starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    // Check if config is up-to-date
    const devices = await this.gladys.system.getContainerDevices(container.id);
    if (!devices || devices.length === 0 || devices[0].PathOnHost !== this.driverPath) {
      // Update Z2M env
      logger.info(`Updating ZwaveJSUI environment...`);
      const { basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const brokerEnv = await exec(
        `sh ./server/services/zwave-js-ui/docker/gladys-zwave-js-ui-zwave-js-ui-env.sh ${basePathOnHost} ${this.mqttUsername} "${this.mqttPassword}" ${this.driverPath} "${this.s2UnauthenticatedKey}" "${this.s2AuthenticatedKey}" "${this.s2AccessControlKey}" "${this.s0LegacyKey}"`,
      );
      logger.trace(brokerEnv);
      logger.info('ZwaveJSUI container is restarting...');
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    logger.info('ZwaveJSUI container successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    this.zwaveJSUIRunning = true;
  } catch (e) {
    logger.error('ZwaveJSUI container failed to start:', e);
    this.zwaveJSUIRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    throw e;
  }
}

module.exports = {
  installZ2mContainer,
};
