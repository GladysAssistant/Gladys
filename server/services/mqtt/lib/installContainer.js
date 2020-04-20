const { DEFAULT } = require('./constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { exec } = require('../../../utils/childProcess');
const logger = require('../../../utils/logger');
const containerParams = require('../docker/eclipse-mosquitto-container.json');

/**
 * @description Get MQTT configuration.
 * @returns {Promise} Current MQTT network configuration.
 * @example
 * installContainer();
 */
async function installContainer() {
  logger.trace('MQTT broker is being installed as Docker container...');

  try {
    await this.gladys.system.pull(containerParams.Image);

    // Prepare broker env
    const brokerEnv = await exec('sh ./services/mqtt/docker/eclipse-mosquitto-env.sh');
    logger.trace(brokerEnv);

    // Create docker container
    await this.gladys.system.createContainer(containerParams);

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
}

module.exports = {
  installContainer,
};
