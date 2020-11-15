const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const mqttContainerDescriptor = require('../docker/z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/zigbee2mqtt-container.json');
const { ServiceNotConfiguredError, PlatformNotCompatible } = require('../../../utils/coreErrors');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  // Run existing containers if Zigbee2mqtt is enabled
  logger.log('z2mEnabled state :', this.z2mEnabled);
  if (this.z2mEnabled) {
    logger.log('Installing & starting containers');

    await this.installMqttContainer();

    // // Look for broker docker container
    // let dockerContainer = await this.gladys.system.getContainers({
    //   all: true,
    //   filters: { name: [mqttContainerDescriptor.name] },
    // });
    // if (dockerContainer.length > 0) {
    //   this.mqttExist = true;
    //   [container] = dockerContainer;
    //   if (container.state !== 'running' && this.z2mEnabled) {
    //     try {
    //       await this.gladys.system.restartContainer(container.id);
    //       // wait 5 seconds for the container to restart
    //       await sleep(5 * 1000);
    //     } catch (e) {
    //       logger.error('MQTT broker failed to start:', e);
    //       this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    //         type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
    //         payload: {
    //           status: DEFAULT.INSTALLATION_STATUS.ERROR,
    //           detail: e,
    //         },
    //       });
    //       this.mqttRunning = false;
    //       this.z2mEnabled = false;
    //       throw e;
    //     }
    //   }
    //   this.mqttRunning = true;
    // } else {
    //   this.mqttRunning = false;
    //   this.z2mEnabled = false;
    // }

    await this.installZ2mContainer();
    // Look for zigbee2mqtt docker container
    // dockerContainer = await this.gladys.system.getContainers({
    //   all: true,
    //   filters: { name: [zigbee2mqttContainerDescriptor.name] },
    // });
    // if (dockerContainer.length > 0) {
    //   this.zigbee2mqttExist = true;
    //   if (this.mqttContainerRunning) {
    //     [container] = dockerContainer;
    //     if (container.state !== 'running' && this.z2mEnabled) {
    //       try {
    //         await this.gladys.system.restartContainer(container.id);
    //         // wait 5 seconds for the container to restart
    //         await sleep(5 * 1000);
    //       } catch (e) {
    //         logger.error('MQTT broker failed to start:', e);
    //         this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    //           type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
    //           payload: {
    //             status: DEFAULT.INSTALLATION_STATUS.ERROR,
    //             detail: e,
    //           },
    //         });
    //         this.zigbee2mqttRunning = false;
    //         this.z2mEnabled = false;
    //         throw e;
    //       }
    //     }
    //     this.zigbee2mqttRunning = true;
    //   } else {
    //     this.zigbee2mqttRunning = false;
    //     this.z2mEnabled = false;
    //   }
    //}

    if (this.mqttRunning && this.zigbee2mqttRunning) {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', true, this.serviceId);
      this.z2mEnabled = true;
    } else {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
      this.z2mEnabled = false;
    }
    const z2mEnabled = this.z2mEnabled;
  }

  const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
  const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
  const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
  logger.log(mqttUrl, mqttUsername, mqttPassword);

  return {
    mqttUrl,
    mqttUsername,
    mqttPassword,
  };
}

module.exports = {
  getConfiguration,
};
