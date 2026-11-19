const { BadParameters } = require('../../../utils/coreErrors');
const { findOwnZ2mContainer } = require('../utils/findOwnZ2mContainer');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Restart Zigbee2mqtt at the request of the user, followed like any restart of Gladys (see
 * restartZ2mContainer); the broker first when Gladys is not connected to it.
 * @returns {Promise} Resolve once Docker restarted the containers.
 * @example
 * await this.restart();
 */
async function restart() {
  this.refuseWhileInstalling('restart Zigbee2mqtt');
  this.runningOperations += 1;
  try {
    if (this.stopped) {
      throw new BadParameters('Zigbee2mqtt: stopped by the user, start it instead');
    }
    const container = await findOwnZ2mContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
    if (!container) {
      throw new BadParameters('Zigbee2mqtt: no container to restart, set it up first');
    }
    if (!this.gladysConnected) {
      const broker = await findOwnZ2mContainer(this.gladys.system, mqttContainerDescriptor);
      if (broker) {
        await this.gladys.system.restartContainer(broker.id);
      }
    }
    await this.restartZ2mContainer(container.id);
    this.emitStatusEvent();
  } finally {
    this.runningOperations -= 1;
  }
}

module.exports = {
  restart,
};
