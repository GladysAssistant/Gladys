const { promisify } = require('util');
const { exec } = require('../../../utils/childProcess');
const { CONFIGURATION } = require('./constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const containerDescriptor = require('../docker/z2m-mqtt-container.json');
const logger = require('../../../utils/logger');

const sleep = promisify(setTimeout);

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installMqttContainer();
 */
async function installMqttContainer() {
  //  logger.info(`Check Gladys network...`);
  //    const networkModeValid = await this.checkDockerNetwork();
  //    if (!networkModeValid) {
  //      throw new PlatformNotCompatible('Gladys should be on host network');
  //    }

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
      const brokerEnv = await exec('sh ./services/zigbee2mqtt/docker/z2m-mqtt-env.sh');
      logger.trace(brokerEnv);

      logger.info(`Creating container...`);
      containerMqtt = await this.gladys.system.createContainer(containerDescriptor);
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
      logger.info('Zigbee2MQTT MQTT broker is starting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);

      // Copy password in broker container
      logger.info(`Creating user/pass...`);
      const z2mMqttUser = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
      const z2mMqttPass = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', z2mMqttUser, z2mMqttPass],
      });
      const mqttUser = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
      const mqttPass = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', mqttUser, mqttPass],
      });
      logger.info('MQTT broker container successfully started');
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
  } else {
    this.mqttExist = true;
    try {
      logger.info('Zigbee2MQTT MQTT broker is starting...');
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
