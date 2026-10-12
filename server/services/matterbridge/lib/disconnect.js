const path = require('path');
const fs = require('fs/promises');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { findContainerByName, isManagedByGladys } = require('../../../utils/dockerContainers');

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
    const container = await findContainerByName(this.gladys.system, matterbridgeContainerDescriptor.name);
    if (!container) {
      logger.warn(`Matterbridge: container "${matterbridgeContainerDescriptor.name}" not found, nothing to stop`);
    } else if (!(await isManagedByGladys(this.gladys.system, container, matterbridgeContainerDescriptor))) {
      // A user container carrying our name is never stopped nor removed
      logger.warn(
        `Matterbridge: container "${matterbridgeContainerDescriptor.name}" was not created by Gladys, leaving it untouched`,
      );
    } else {
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);

      const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

      const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);

      await fs.rm(configFilepath, { recursive: true });

      this.matterbridgeRunning = false;
    }
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
