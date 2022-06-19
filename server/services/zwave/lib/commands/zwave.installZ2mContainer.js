const { promisify } = require('util');
const { exec } = require('../../../../utils/childProcess');
const { CONFIGURATION } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../../docker/gladys-zwave-zwave2mqtt-container.json');
const logger = require('../../../../utils/logger');
const cloneDeep = require('lodash.clonedeep');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Zwave2mqtt container.
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
      logger.info('Zwave2mqtt is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      // Prepare Z2M env
      logger.info(`Preparing Zwave2mqtt environment...`);
      const basePathOnHost = this.gladys.config.servicesFolder('zwave');
      const mqttUser = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE2MQTT_MQTT_USERNAME_KEY, this.serviceId);
      const mqttPass = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE2MQTT_MQTT_PASSWORD_KEY, this.serviceId);
      const brokerEnv = await exec(
        `sh ./server/services/zwave/docker/gladys-zwave-zwave2mqtt-env.sh ${basePathOnHost} ${mqttUser} "${mqttPass}"`,
      );
      logger.trace(brokerEnv);
      containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zwave2mqtt:/usr/src/app/store`);

      const zwaveDriverPath = await this.gladys.variable.getValue(CONFIGURATION.ZWAVE_DRIVER_PATH, this.serviceId);
      logger.info(`Configuration of Device ${zwaveDriverPath}`);
      containerDescriptorToMutate.HostConfig.Devices[0].PathOnHost = zwaveDriverPath;

      logger.info(`Creation of container...`);
      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);
      logger.info('Zwave2mqtt successfully installed and configured as Docker container');
      this.zwave2mqttExist = true;
      this.zwave2mqttRunning = true;
    } catch (e) {
      this.zwave2mqttExist = false;
      logger.error('Zwave2mqtt failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE,
      });
      // throw e;
    }
  }

  try {
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;
    if (container.state !== 'running') {
      logger.info('Zwave2mqtt container is starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    logger.info('Zwave2mqtt container successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE,
    });
    this.zwave2mqttRunning = true;
    this.zwave2mqttExist = true;
  } catch (e) {
    logger.error('Zwave2mqtt container failed to start:', e);
    this.zwave2mqttRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVE.STATUS_CHANGE,
    });
    // throw e;
  }
}

module.exports = {
  installZ2mContainer,
};
