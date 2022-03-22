const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');
const { exec } = require('../../../utils/childProcess');
const { CONFIGURATION } = require('./constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const containerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');
const logger = require('../../../utils/logger');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Zigbee2mqtt container.
 * @example
 * installZ2mContainer();
 */
async function installZ2mContainer() {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    try {
      logger.info('Zigbee2mqtt is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      // Prepare Z2M env
      logger.info(`Preparing Zigbee2mqtt environment...`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);
      const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const mqttUser = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
      const mqttPass = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);
      const brokerEnv = await exec(
        `sh ./services/zigbee2mqtt/docker/gladys-z2m-zigbee2mqtt-env.sh ${basePathOnContainer} ${mqttUser} "${mqttPass}"`,
      );
      logger.trace(brokerEnv);
      containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zigbee2mqtt/z2m:/app/data`);

      const driverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
      logger.info(`Configuration of Device ${driverPath}`);
      containerDescriptorToMutate.HostConfig.Devices[0].PathOnHost = driverPath;

      logger.info(`Creation of container...`);
      const containerLog = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerLog);
      logger.info('Zigbee2mqtt successfully installed and configured as Docker container');
      this.zigbee2mqttExist = true;
    } catch (e) {
      this.zigbee2mqttExist = false;
      logger.error('Zigbee2mqtt failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
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
      logger.info('Zigbee2mqtt container is starting...');
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    logger.info('Zigbee2mqtt container successfully started');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    this.zigbee2mqttRunning = true;
    this.zigbee2mqttExist = true;
  } catch (e) {
    logger.error('Zigbee2mqtt container failed to start:', e);
    this.zigbee2mqttRunning = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    throw e;
  }
}

module.exports = {
  installZ2mContainer,
};
