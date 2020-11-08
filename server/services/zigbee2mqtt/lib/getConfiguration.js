const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');
const { generate } = require('../../../utils/password');
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
  let brokerContainerAvailable = false;
  //   const dockerBased = await this.gladys.system.isDocker();

  let networkModeValid = false;

  dockerBased = true;

  if (dockerBased) {
    networkModeValid = (await this.gladys.system.getNetworkMode()) === 'host';

    // Creation of credentials for Gladys & Z2M for connection to broker
    const mqttPw = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
    if (!mqttPw) {
      await this.gladys.variable.setValue(CONFIGURATION.MQTT_URL_KEY, CONFIGURATION.MQTT_URL_VALUE, this.serviceId);
      await this.gladys.variable.setValue(
        CONFIGURATION.Z2M_MQTT_USERNAME_KEY,
        CONFIGURATION.Z2M_MQTT_USERNAME_VALUE,
        this.serviceId,
      );
      await this.gladys.variable.setValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, generate(), this.serviceId);
      await this.gladys.variable.setValue(
        CONFIGURATION.GLADYS_MQTT_USERNAME_KEY,
        CONFIGURATION.GLADYS_MQTT_USERNAME_VALUE,
        this.serviceId,
      );
      await this.gladys.variable.setValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, generate(), this.serviceId);
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
    }

    // Run existing containers if Zigbee2mqtt is enabled
    let mqttRunning, zigbee2mqttRunning;
    let zigbee2mqttEnabled = await this.gladys.variable.getValue('ZIGBEE2MQTT_ENABLED', this.serviceId);

    // Look for broker docker container
    let dockerContainer = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [mqttContainerDescriptor.name] },
    });
    if (dockerContainer.length > 0) {
      [container] = dockerContainer;
      if (container.state !== 'running' && zigbee2mqttEnabled) {
        await this.gladys.system.restartContainer(container.id);
        // wait 5 seconds for the container to restart
        await sleep(5 * 1000);
      }
      this.mqttContainerRunning = true;
    } else this.mqttContainerRunning = false;

    // Look for zigbee2mqtt docker container
    dockerContainer = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [zigbee2mqttContainerDescriptor.name] },
    });
    if (dockerContainer.length > 0) {
      [container] = dockerContainer;
      if (container.state !== 'running' && zigbee2mqttEnabled) {
        await this.gladys.system.restartContainer(container.id);
        // wait 5 seconds for the container to restart
        await sleep(5 * 1000);
      }
      this.z2mContainerRunning = true;
    } else this.z2mContainerRunning = false;

    if (!this.mqttContainerRunning || !this.z2mContainerRunning) {
      await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
      zigbee2mqttEnabled = false;
    }

    // Test if donglez is present
    let dongleOK = false;
    this.usbConfigured = false;
    const zigbee2mqttDriverPath = await this.gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', this.serviceId);
    if (!zigbee2mqttDriverPath) {
      logger.info(`Zigbee2mqtt USB dongle not attached`);
      if (zigbee2mqttEnabled) {
        await this.gladys.variable.setValue('ZIGBEE2MQTT_ENABLED', false, this.serviceId);
      }
    } else {
      const usb = this.gladys.service.getService('usb');
      const usbList = await usb.list();
      usbList.forEach((usbPort) => {
        if (zigbee2mqttDriverPath === usbPort.path) {
          dongleOK = true;
          this.usbConfigured = true;
          logger.info(`Zigbee2mqtt USB dongle attached to ${zigbee2mqttDriverPath}`);
        }
      });
    }
    if (!dongleOK) {
      throw new ServiceNotConfiguredError('ZIGBEE2MQTT_DRIVER_PATH_NOT_FOUND');
    }

    const mqttUrl = await this.gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, this.serviceId);
    const mqttUsername = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
    const mqttPassword = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
    logger.log(mqttUrl, mqttUsername, mqttPassword);

    return {
      mqttUrl,
      mqttUsername,
      mqttPassword,
      zigbee2mqttEnabled,
    };
  } else {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
}

module.exports = {
  getConfiguration,
};
