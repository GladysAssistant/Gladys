const logger = require('../../../utils/logger');
const { exec } = require('../../../utils/childProcess');
const { generate } = require('../../../utils/password');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

const { DEFAULT } = require('./constants');
const containerDescriptor = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installContainer();
 */
async function installContainer() {
  logger.info('MQTT broker is being installed as Docker container...');

  try {
    logger.info(`Check Gladys network...`);
    const networkModeValid = await this.checkDockerNetwork();
    if (!networkModeValid) {
      throw new PlatformNotCompatible('Gladys should be on host network');
    }

    logger.info(`Pulling ${containerDescriptor.Image} image...`);
    await this.gladys.system.pull(containerDescriptor.Image);

    // Prepare broker env
    logger.info(`Preparing broker environment...`);
    const brokerEnv = await exec('sh ./services/mqtt/docker/eclipse-mosquitto-env.sh');
    logger.trace(brokerEnv);

    logger.info(`Creating container...`);
    const container = await this.gladys.system.createContainer(containerDescriptor);
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

  await this.saveConfiguration({
    mqttUrl: 'mqtt://localhost',
    mqttUsername: 'gladys',
    mqttPassword: generate(20, { number: true, lowercase: true, uppercase: true }),
    useEmbeddedBroker: true,
  });
}

module.exports = {
  installContainer,
};
