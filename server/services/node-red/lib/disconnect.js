const path = require('path');
const fs = require('fs/promises');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const nodeRedContainerDescriptor = require('../docker/gladys-node-red-container.json');
const { DEFAULT } = require('./constants');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  let container;

  // Stop NodeRed container
  try {
    const dockerContainer = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [nodeRedContainerDescriptor.name] },
    });
    [container] = dockerContainer;
    await this.gladys.system.stopContainer(container.id);
    await this.gladys.system.removeContainer(container.id);

    const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);

    await fs.rm(path.dirname(configFilepath), { recursive: true });

    this.nodeRedRunning = false;
    this.gladysConnected = false;
  } catch (e) {
    logger.warn(`Node-RED: failed to stop container ${container.id}:`, e);
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
  });
}

module.exports = {
  disconnect,
};
