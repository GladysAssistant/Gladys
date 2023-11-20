const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');
const { exec } = require('../../../../utils/childProcess');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../../docker/gladys-zwavejsui-zwavejsui-container.json');
const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../constants');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts ZwaveJSUI container.
 * @example
 * installZwaveJSUIContainer();
 */
async function installZwaveJSUIContainer() {
  this.zwaveJSUIExist = false;
  this.zwaveJSUIRunning = false;

  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(
    CONFIGURATION.DEFAULT_ZWAVEJSUI_MQTT_PASSWORD,
    this.serviceId,
  );
  const driverPath = await this.gladys.variable.getValue(CONFIGURATION.DRIVER_PATH, this.serviceId);
  const s2UnauthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_UNAUTHENTICATED, this.serviceId);
  const s2AuthenticatedKey = await this.gladys.variable.getValue(CONFIGURATION.S2_AUTHENTICATED, this.serviceId);
  const s2AccessControlKey = await this.gladys.variable.getValue(CONFIGURATION.S2_ACCESS_CONTROL, this.serviceId);
  const s0LegacyKey = await this.gladys.variable.getValue(CONFIGURATION.S0_LEGACY, this.serviceId);

  const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0 || (container && container.state === 'created')) {
    if (container && container.state === 'created') {
      logger.info('ZwaveJSUI is already installed as Docker container...');
      logger.info(`Removing ${container.id} container...`);
      await this.gladys.system.removeContainer(container.id);
    }

    try {
      logger.info('ZwaveJSUI is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      logger.info(`Preparing ZwaveJSUI environment...`);
      logger.info(`Creating configuration file ${basePathOnHost}/zwave-js-ui/settings.json...`);
      const brokerEnv = await exec(
        `sh ./services/zwave-js-ui/docker/gladys-zwavejsui-zwavejsui-env.sh ${basePathOnContainer} ${mqttUsername} "${mqttPassword}" ${driverPath} "${s2UnauthenticatedKey}" "${s2AuthenticatedKey}" "${s2AccessControlKey}" "${s0LegacyKey}"`,
      );
      logger.info(`Configuration file ${basePathOnHost}/zwave-js-ui/settings.json created: ${brokerEnv}`);
      containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zwave-js-ui:/usr/src/app/store`);

      containerDescriptorToMutate.HostConfig.Devices[0].PathOnHost = driverPath;

      logger.info(`Creation of container...`);
      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.info(`ZwaveJSUI successfully installed and configured as Docker container: ${containerLog}`);
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

    this.zwaveJSUIExist = true;

    // Check if config is up-to-date
    const devices = await this.gladys.system.getContainerDevices(container.id);
    if (devices.length === 0 || devices[0].PathOnHost !== driverPath) {
      // Update ZwaveJSUI env
      logger.info(`Updating ZwaveJSUI environment...`);
      const brokerEnv = await exec(
        `sh ./services/zwave-js-ui/docker/gladys-zwavejsui-zwavejsui-env.sh ${basePathOnContainer} ${mqttUsername} "${mqttPassword}" ${driverPath} "${s2UnauthenticatedKey}" "${s2AuthenticatedKey}" "${s2AccessControlKey}" "${s0LegacyKey}"`,
      );
      logger.info(`ZwaveJSUI configuration updated: ${brokerEnv}`);

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
  installZwaveJSUIContainer,
};
