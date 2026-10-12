const path = require('path');
const fs = require('fs/promises');
const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { findContainerByName, isManagedByGladys } = require('../../../utils/dockerContainers');

const nodeRedContainerDescriptor = require('../docker/gladys-node-red-container.json');
const { DEFAULT } = require('./constants');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  // Stop NodeRed container
  try {
    const container = await findContainerByName(this.gladys.system, nodeRedContainerDescriptor.name);
    if (!container) {
      logger.warn(`Node-RED: container "${nodeRedContainerDescriptor.name}" not found, nothing to stop`);
    } else if (!(await isManagedByGladys(this.gladys.system, container, nodeRedContainerDescriptor))) {
      // A user container carrying our name is never stopped nor removed
      logger.warn(
        `Node-RED: container "${nodeRedContainerDescriptor.name}" was not created by Gladys, leaving it untouched`,
      );
    } else {
      await this.gladys.system.stopContainer(container.id);
      await this.gladys.system.removeContainer(container.id);

      const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

      const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);

      await fs.rm(path.dirname(configFilepath), { recursive: true });

      this.nodeRedRunning = false;
      this.gladysConnected = false;
    }
  } catch (e) {
    logger.warn(`Node-RED: failed to stop container ${nodeRedContainerDescriptor.name}:`, e);
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
  });
}

module.exports = {
  disconnect,
};
