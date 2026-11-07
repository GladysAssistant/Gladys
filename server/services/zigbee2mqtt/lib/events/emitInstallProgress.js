const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

// A pull reports its progress many times a second: the setup page does not need more than this
const MIN_INTERVAL_IN_MS = 500;

/**
 * @description Send the progress of the installation and of the prefetch to the setup page, at most twice a second.
 * A call within the interval is sent once it is over, with the state of that time: the last state is always sent.
 * @example
 * this.emitInstallProgress();
 */
function emitInstallProgress() {
  const waitInMs =
    this.installProgressSentAt === null ? 0 : this.installProgressSentAt + MIN_INTERVAL_IN_MS - Date.now();
  if (waitInMs > 0) {
    if (this.installProgressTimer === null) {
      this.installProgressTimer = setTimeout(() => {
        this.installProgressTimer = null;
        this.emitInstallProgress();
      }, waitInMs);
    }
    return;
  }
  this.installProgressSentAt = Date.now();
  const { installation, prefetch } = this;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS,
    payload: { installation, prefetch },
  });
  // The job of the installation, in the tasks of the settings, follows the same progress at the same pace
  if (this.installationJobId && installation.progress !== this.installationJobProgress) {
    this.installationJobProgress = installation.progress;
    // Not awaited: called from the progress events of a pull
    // eslint-disable-next-line promise/prefer-await-to-then
    this.gladys.job.updateProgress(this.installationJobId, installation.progress).catch((e) => {
      logger.warn(`Zigbee2mqtt: failed to update the progress of the installation job: ${e.message}`);
    });
  }
}

module.exports = {
  emitInstallProgress,
};
