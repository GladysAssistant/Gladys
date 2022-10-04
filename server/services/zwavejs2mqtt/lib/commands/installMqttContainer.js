const { promisify } = require('util');
const cloneDeep = require('lodash.clonedeep');
const { exec } = require('../../../../utils/childProcess');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const containerDescriptor = require('../../docker/gladys-zwavejs2mqtt-mqtt-container.json');
const logger = require('../../../../utils/logger');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts MQTT container.
 * @example
 * installMqttContainer();
 */
async function installMqttContainer() {
  this.mqttRunning = false;
  this.mqttExist = false;

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

      const containerDescriptorToMutate = cloneDeep(containerDescriptor);

      // Prepare broker env
      logger.info(`Preparing broker environment...`);
      const { basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const brokerEnv = await exec(
        `sh ./services/zwavejs2mqtt/docker/gladys-zwavejs2mqtt-mqtt-env.sh ${basePathOnHost}/zwavejs2mqtt`,
      );
      logger.trace(brokerEnv);
      containerDescriptorToMutate.HostConfig.Binds.push(
        `${basePathOnHost}/zwavejs2mqtt/mosquitto/config:/mosquitto/config`,
      );

      logger.info(`Creating container...`);
      containerMqtt = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerMqtt);
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker failed to install as Docker container:', e);
      this.mqttExist = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
      return;
    }

    try {
      // Container restart to inintialize users configuration
      logger.info('MQTT broker is starting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
      logger.info('MQTT broker container successfully started');

      // Copy password in broker container
      logger.info(`Creating user/pass...`);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', this.mqttUsername, this.mqttPassword],
      });

      // Container restart to inintialize users configuration
      logger.info('MQTT broker is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
      logger.info('MQTT broker container successfully started and configured');

      this.mqttRunning = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
      // throw e;
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
        logger.info('MQTT broker is starting...');
        await this.gladys.system.restartContainer(container.id);
        // wait 5 seconds for the container to restart
        await sleep(5 * 1000);
      }

      logger.info('MQTT broker container successfully started');
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
      this.mqttRunning = true;
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
      });
      // throw e;
    }
  }
}

module.exports = {
  installMqttContainer,
};
