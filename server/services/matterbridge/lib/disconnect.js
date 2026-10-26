const path = require('path');
const fs = require('fs/promises');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { findOwnContainer } = require('../../../utils/dockerContainers');

const matterbridgeContainerDescriptor = require('../docker/gladys-matterbridge-container.json');
const { DEFAULT } = require('./constants');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  // Stop Matterbridge container
  try {
    // A user container carrying our name is never stopped nor removed: it is reported as absent
    const container = await findOwnContainer(this.gladys.system, matterbridgeContainerDescriptor);
    if (container) {
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);

      const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

      const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);

      await fs.rm(configFilepath, { recursive: true });
    }

    // Whether it was ours or not, our Matterbridge is not running anymore
    this.matterbridgeRunning = false;
  } catch (e) {
    logger.warn(`Matterbridge: failed to stop container ${matterbridgeContainerDescriptor.name}:`, e);
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
  });
}

module.exports = {
  disconnect,
};
