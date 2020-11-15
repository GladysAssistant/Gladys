const logger = require('../../../utils/logger');
const { exec } = require('../../../utils/childProcess');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { CONFIGURATION } = require('./constants');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

const { DEFAULT } = require('./constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const containerDescriptor = require('../docker/zigbee2mqtt-container.json');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

/**
 * @description Get Zigbee2MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installZ2mContainer();
 */
async function installZ2mContainer() {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { ancestor: [containerDescriptor.Image] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    try {
      logger.info('Zigbee2mqtt is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);
      // Prepare Z2M env
      logger.info(`Preparing Zigbee2mqtt environment...`);
      const mqttUser = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
      const mqttPass = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);
      const brokerEnv = await exec(`sh ./services/zigbee2mqtt/docker/zigbee2mqtt-env.sh ${mqttUser} "${mqttPass}"`);
      logger.trace(brokerEnv);

      logger.info(`Creating container...`);
      const driverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
      await exec(
        `sed -i 's%^"PathOnHost":.*%"PathOnHost": "${driverPath}",%' ./services/zigbee2mqtt/docker/zigbee2mqtt-container.json`,
      );

      const containerLog = await this.gladys.system.createContainer(containerDescriptor);
      logger.trace(containerLog);
      logger.info('Zigbee2mqtt successfully installed as Docker container');
      this.zigbee2mqttExist = true;
    } catch (e) {
      logger.error('Zigbee2mqtt failed to install as Docker container:', e);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  }

  try {
    logger.info('Zigbee2mqtt is starting...');
    dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerDescriptor.name] },
    });
    [container] = dockerContainers;
    if (container.state !== 'running') {
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    logger.info('Zigbee2mqtt successfully started');
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
