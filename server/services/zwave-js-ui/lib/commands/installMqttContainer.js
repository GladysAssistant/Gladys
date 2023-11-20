const { promisify } = require('util');
const cloneDeep = require('lodash.clonedeep');
const { exec } = require('../../../../utils/childProcess');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../../docker/gladys-zwavejsui-mqtt-container.json');
const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../constants');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts MQTT container.
 * @example
 * installMqttContainer();
 */
async function installMqttContainer() {
  this.mqttRunning = false;
  this.mqttExist = false;

  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(
    CONFIGURATION.DEFAULT_ZWAVEJSUI_MQTT_PASSWORD,
    this.serviceId,
  );

  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    let containerMqtt;
    try {
      logger.info('ZwaveJSUI MQTT is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      // Prepare broker env
      logger.info(`Preparing ZwaveJSUI MQTT environment...`);
      const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const brokerEnv = await exec(
        `sh ./services/zwave-js-ui/docker/gladys-zwavejsui-mqtt-env.sh ${basePathOnContainer}/zwave-js-ui`,
      );
      logger.info(`ZwaveJSUI MQTT configuration updated: ${brokerEnv}`);
      containerDescriptorToMutate.HostConfig.Binds.push(
        `${basePathOnHost}/zwave-js-ui/mosquitto/config:/mosquitto/config`,
      );

      logger.info(`Creating ZwaveJSUI MQTT container...`);
      containerMqtt = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.info(`ZwaveJSUI MQTT successfully installed and configured as Docker container: ${containerMqtt}`);
      this.mqttExist = true;
    } catch (e) {
      logger.error('ZwaveJSUI MQTT failed to install as Docker container:', e);
      this.mqttExist = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      throw e;
    }

    try {
      // Container restart to initialize configuration
      logger.info('ZwaveJSUI MQTT is starting...');
      await this.gladys.system.restartContainer(containerMqtt.id);

      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
      logger.info('ZwaveJSUI MQTT container successfully started');

      // Copy password in broker container
      logger.info(`Creating user/pass...`);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', mqttUsername, mqttPassword],
      });

      // Container restart to inintialize users configuration
      logger.info('ZwaveJSUI MQTT is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
      logger.info('ZwaveJSUI MQTT container successfully started and configured');

      this.mqttRunning = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
    } catch (e) {
      logger.error('ZwaveJSUI MQTT container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
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
      if (container.state !== 'running' && container.state !== 'restarting') {
        logger.info('ZwaveJSUI MQTT is starting...');
        await this.gladys.system.restartContainer(container.id);
        // wait 5 seconds for the container to restart
        await sleep(5 * 1000);
      }

      logger.info('ZwaveJSUI MQTT container successfully started');
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      this.mqttRunning = true;
    } catch (e) {
      logger.error('ZwaveJSUI MQTT container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
      });
      throw e;
    }
  }
}

module.exports = {
  installMqttContainer,
};
