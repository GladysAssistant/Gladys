const cloneDeep = require('lodash.clonedeep');
const logger = require('../../../utils/logger');
const { generate } = require('../../../utils/password');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ConflictError, PlatformNotCompatible } = require('../../../utils/coreErrors');
const { findManagedContainer } = require('../../../utils/dockerContainers');

const { CONFIGURATION, DEFAULT } = require('./constants');
const { isBrokerConfiguredByGladys } = require('./isBrokerConfiguredByGladys');
const containerDescriptor = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Get MQTT configuration.
 * @param {boolean} saveConfiguration - Save new configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installContainer();
 */
async function installContainer(saveConfiguration = true) {
  logger.info('MQTT broker is being installed as Docker container...');

  let container;
  try {
    logger.info(`Check Gladys network...`);
    const networkModeValid = await this.checkDockerNetwork();
    if (!networkModeValid) {
      throw new PlatformNotCompatible('Gladys should be on host network');
    }

    // Fail early, with a clear message, if the name is taken by a container that is not ours
    const existingContainer = await findManagedContainer(this.gladys.system, containerDescriptor);
    if (existingContainer) {
      // A broker Gladys never configured (no label, no stored version) is a user one as well
      const mosquittoVersion = await this.gladys.variable.getValue(
        CONFIGURATION.MQTT_MOSQUITTO_VERSION,
        this.serviceId,
      );
      if (!isBrokerConfiguredByGladys(existingContainer, mosquittoVersion)) {
        throw new ConflictError(
          `Container "${containerDescriptor.name}" already exists but was not configured by Gladys: rename or remove it`,
        );
      }
    }

    logger.info(`Pulling ${containerDescriptor.Image} image...`);
    await this.gladys.system.pull(containerDescriptor.Image);

    // Prepare broker env
    logger.info(`Preparing broker environment...`);
    await this.configureContainer();

    logger.info(`Creating container...`);
    const containerDescriptorToMutate = cloneDeep(containerDescriptor);
    // get the volume where Gladys container is mounted
    const { basePathOnHost } = await this.gladys.system.getGladysBasePath();
    containerDescriptorToMutate.HostConfig.Binds = [`${basePathOnHost}/mosquitto:/mosquitto/config`];
    container = await this.gladys.system.createContainer(containerDescriptorToMutate);
    logger.trace(container);

    logger.info('MQTT broker successfully installed as Docker container');
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.DONE,
      },
    });
  } catch (e) {
    logger.error('MQTT broker failed to install as Docker container:', e);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.ERROR,
        detail: e,
      },
    });
    throw e;
  }

  if (saveConfiguration) {
    logger.info('MQTT saving configuration');

    await this.saveConfiguration({
      mqttUrl: 'mqtt://localhost',
      mqttUsername: 'gladys',
      mqttPassword: generate(20, { number: true, lowercase: true, uppercase: true }),
      useEmbeddedBroker: true,
    });
  }

  logger.info('MQTT installed');

  return container;
}

module.exports = {
  installContainer,
};
