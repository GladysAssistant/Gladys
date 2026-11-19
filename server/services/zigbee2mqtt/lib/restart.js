const { BadParameters } = require('../../../utils/coreErrors');
const { findOwnZ2mContainer } = require('../utils/findOwnZ2mContainer');
const { INSTALLATION_STATE } = require('./constants');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Restart Zigbee2mqtt at the request of the user, followed like any restart of Gladys (see
 * restartZ2mContainer); the broker first when Gladys is not connected to it. Without a client of the broker (the last
 * init failed before connecting), restarting the containers would not connect Gladys again: an installation of kind
 * "start" runs that init again (see start).
 * @returns {Promise} Resolve once Docker restarted the containers, or once the start is launched.
 * @example
 * await this.restart();
 */
async function restart() {
  this.refuseWhileInstalling('restart Zigbee2mqtt');
  if (this.stopped) {
    throw new BadParameters('Zigbee2mqtt: stopped by the user, start it instead');
  }
  if (!this.mqttClient) {
    await this.start();
    return;
  }
  this.runningOperations += 1;
  try {
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
    try {
      await this.restartZ2mContainer(container.id);
    } catch (e) {
      // Refused by Docker: nothing restarted, the failure retried still describes Zigbee2mqtt
      this.emitStatusEvent();
      throw e;
    }
    // Restarted: the failure retried no longer describes Zigbee2mqtt, the logs of the new run tell their own
    this.z2mContainerError = null;
    if (this.installation.state === INSTALLATION_STATE.FAILED) {
      this.clearInstallation();
    }
    this.emitStatusEvent();
  } finally {
    this.runningOperations -= 1;
  }
}

module.exports = {
  restart,
};
