const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const nodeRedContainerDescriptor = require('../docker/gladys-node-red-container.json');

/**
 * @description Disconnect service from dependent containers.
 * @example
 * disconnect();
 */
async function disconnect() {
  let container;

  // Stop backup reccurent job
  if (this.backupScheduledJob) {
    this.backupScheduledJob.cancel();
  }

  this.gladysConnected = false;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
  });

  // Stop NodeRed container
  const dockerContainer = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [nodeRedContainerDescriptor.name] },
  });
  [container] = dockerContainer;
  await this.gladys.system.stopContainer(container.id);
  this.nodeRedRunning = false;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
  });


}

module.exports = {
  disconnect,
};
