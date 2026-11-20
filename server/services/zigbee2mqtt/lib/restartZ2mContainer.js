const logger = require('../../../utils/logger');
const { formatDuration } = require('../utils/formatDuration');

/**
 * @description Restart the Zigbee2mqtt container and follow its new run: until Zigbee2mqtt answers, the UI tells that
 * it is starting, for a bounded time (a Zigbee2mqtt that crashes before connecting to the broker never says anything),
 * and the logs of the new run tell why it does not start (see readZ2mContainerLogs).
 * @param {string} containerId - Id of the Zigbee2mqtt container.
 * @returns {Promise} Resolve once Docker restarted it.
 * @example
 * await this.restartZ2mContainer('8d2f4b6c1a3e');
 */
async function restartZ2mContainer(containerId) {
  logger.info('Zigbee2mqtt container is (re)starting...');
  this.zigbee2mqttStarting = true;
  // To log how long Zigbee2mqtt takes to answer once restarted
  this.zigbee2mqttStartingSince = Date.now();
  clearTimeout(this.startingTimer);
  this.startingTimer = setTimeout(() => {
    this.startingTimer = null;
    this.zigbee2mqttStarting = false;
    this.emitStatusEvent();
  }, this.zigbee2mqttStartingTimeoutInMs);
  // Only the logs of the new run explain why it fails. Docker counts in seconds: taken before the restart, not to miss
  // the first lines of the new run
  const restartedAt = Math.floor(Date.now() / 1000);
  const restartStartedAt = Date.now();
  // A new run, counted before Docker stops the previous one: its reader ends with it, during the restart, and its
  // outcome is ignored (see readZ2mContainerLogs)
  this.z2mRun += 1;
  try {
    await this.gladys.system.restartContainer(containerId);
  } catch (e) {
    // Nothing restarted: nothing starts either. The caller tells the status
    clearTimeout(this.startingTimer);
    this.startingTimer = null;
    this.zigbee2mqttStarting = false;
    throw e;
  }
  logger.info(`Zigbee2mqtt container started in ${formatDuration(Date.now() - restartStartedAt)}`);
  // We read the logs in non blocking mode
  this.readZ2mContainerLogs(containerId, restartedAt);
}

module.exports = {
  restartZ2mContainer,
};
