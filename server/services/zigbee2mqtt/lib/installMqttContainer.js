const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');
const path = require('path');
const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const containerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts MQTT container.
 * @param {object} config - Service configuration properties.
 * @example
 * await z2m.installMqttContainer(config);
 */
async function installMqttContainer(config) {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    let containerMqtt;
    try {
      logger.info('MQTT broker is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

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
      // create an empty password file so that the container can start
      // it'll be filled later
      await fse.writeFile(mosquittoPasswordFilePath, '', 'utf-8');

      await containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zigbee2mqtt/mqtt:/mosquitto/config`);

      logger.info(`Creating container with data in "${basePathOnHost}" on host...`);
      containerMqtt = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerMqtt);
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker failed to install as Docker container:', e);
      this.mqttExist = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }

    try {
      logger.info('MQTT broker is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);

      // Wait a few seconds for the container to restart
      await sleep(this.containerRestartWaitTimeInMs);

      // Copy password in broker container
      const { z2mMqttUsername, z2mMqttPassword, mqttUsername, mqttPassword } = config;
      logger.info(`Creating user/pass...`);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', z2mMqttUsername, z2mMqttPassword],
      });
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', mqttUsername, mqttPassword],
      });

      // Container restart to inintialize users configuration
      logger.info('MQTT broker is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(this.containerRestartWaitTimeInMs);

      logger.info('MQTT broker container successfully started and configured');

      this.mqttRunning = true;
      this.mqttExist = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  } else {
    this.mqttExist = true;
    try {
      dockerContainers = await this.gladys.system.getContainers({
        all: true,
        filters: { name: [containerDescriptor.name] },
      });
      [container] = dockerContainers;
      if (container.state !== 'running') {
        logger.info('MQTT broker is starting...');
        await this.gladys.system.restartContainer(container.id);
        // wait a few seconds for the container to restart
        await sleep(this.containerRestartWaitTimeInMs);
      }

      logger.info('MQTT broker container successfully started');
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      this.mqttRunning = true;
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  }
}

module.exports = {
  installMqttContainer,
};
