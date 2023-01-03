const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');

const { exec } = require('../../../utils/childProcess');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const containerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts Zigbee2mqtt container.
 * @param {Object} config - Service configuration properties.
 * @example
 * await z2m.installZ2mContainer(config);
 */
async function installZ2mContainer(config) {
  const { z2mDriverPath, z2mMqttUsername, z2mMqttPassword } = config;

  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
  const containerPath = `${basePathOnHost}/zigbee2mqtt/z2m`;
  if (dockerContainers.length === 0) {
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
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  }

  // Prepare Z2M env
  logger.info(`Preparing Zigbee2mqtt environment...`);
  const brokerEnv = await exec(
    `sh ./services/zigbee2mqtt/docker/gladys-z2m-zigbee2mqtt-env.sh ${basePathOnContainer} ${z2mMqttUsername} "${z2mMqttPassword}"`,
  );
  logger.trace(brokerEnv);

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
