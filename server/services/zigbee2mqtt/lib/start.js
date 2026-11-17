const logger = require('../../../utils/logger');
const { BadParameters } = require('../../../utils/coreErrors');
const { CONFIGURATION, INSTALLATION_KIND, INSTALLATION_STATE } = require('./constants');
const { setRestartPolicy } = require('./stop');

const mqttContainerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const zigbee2mqttContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

/**
 * @description Forget the stop of the user (see stop): Docker starts our containers again after a crash or a restart
 * of the machine, and the next init starts Zigbee2mqtt.
 * @returns {Promise} Resolve once forgotten.
 * @example
 * await this.clearStop();
 */
async function clearStop() {
  await this.gladys.variable.destroy(CONFIGURATION.Z2M_STOPPED, this.serviceId);
  await setRestartPolicy(this.gladys.system, zigbee2mqttContainerDescriptor, 'always');
  await setRestartPolicy(this.gladys.system, mqttContainerDescriptor, 'always');
  this.stopped = false;
  this.stoppedAt = null;
  this.emitStatusEvent();
}

/**
 * @description Start Zigbee2mqtt again at the request of the user, after a stop: answers at once and runs an
 * installation of kind "start" in a job, followed like the one of a setup (an update waiting for its images runs then).
 * @returns {Promise} Resolve once the installation is launched.
 * @example
 * await this.start();
 */
async function start() {
  if (!this.configured) {
    throw new BadParameters('Zigbee2mqtt: nothing is set up yet, set it up first');
  }
  this.refuseWhileInstalling('start Zigbee2mqtt');
  this.startInstallation(INSTALLATION_KIND.START);
  try {
    await this.clearStop();
  } catch (e) {
    this.finishInstallation(e);
    throw e;
  }

  const { installation } = this;
  // As at the start of Gladys, not as a setup: the port of the interface stays the saved one
  // eslint-disable-next-line promise/prefer-await-to-then
  this.runInstallation(false).catch((e) => {
    // The installation tells its own failure, unless its job failed to start
    if (this.installation === installation && installation.state === INSTALLATION_STATE.RUNNING) {
      logger.error('Zigbee2mqtt: start job failed to start:', e);
      this.finishInstallation(e);
    }
  });
}

module.exports = {
  clearStop,
  start,
};
