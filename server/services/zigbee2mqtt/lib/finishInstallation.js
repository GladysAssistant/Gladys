const logger = require('../../../utils/logger');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { INSTALLATION_STATE, INSTALLATION_PHASE_STATE } = require('./constants');
const { formatDuration } = require('../utils/formatDuration');

/**
 * @description Convert the error of a failed installation into what the setup page shows.
 * @param {Error} error - Error of the installation.
 * @returns {object} A known `code` for the setup page to translate, or a `null` code and the raw `message`.
 * @example
 * const installationError = getInstallationError(new PlatformNotCompatible('DOCKER_BAD_NETWORK'));
 */
function getInstallationError(error) {
  // Zigbee2mqtt failed to start, see waitForZigbee2mqtt
  if (error.installationError) {
    return error.installationError;
  }
  // Not on Docker, or not on its host network: the message is the code
  if (error instanceof PlatformNotCompatible) {
    return { code: error.message, message: null };
  }
  return { code: null, message: error.message };
}

/**
 * @description Tell the outcome of the running installation. Shown by the setup page until the next installation.
 * @param {Error} [error] - Why the installation failed, nothing when it succeeded.
 * @example
 * this.finishInstallation(null);
 */
function finishInstallation(error) {
  const { installation } = this;
  installation.durationMs = Date.now() - this.installationStartedAt;
  const duration = formatDuration(installation.durationMs);
  if (error) {
    installation.state = INSTALLATION_STATE.FAILED;
    installation.error = getInstallationError(error);
    // The phase that was running is the one that failed
    installation.phases
      .filter((phase) => phase.state === INSTALLATION_PHASE_STATE.RUNNING)
      .forEach((phase) => {
        phase.state = INSTALLATION_PHASE_STATE.FAILED;
      });
    logger.warn(`Zigbee2mqtt: ${installation.kind} failed after ${duration}`);
  } else {
    installation.state = INSTALLATION_STATE.DONE;
    // Phases with nothing to do, like the containers with an external broker
    installation.phases
      .filter((phase) => phase.state === INSTALLATION_PHASE_STATE.PENDING)
      .forEach((phase) => {
        phase.state = INSTALLATION_PHASE_STATE.SKIPPED;
        phase.progress = 100;
      });
    installation.progress = 100;
    logger.info(`Zigbee2mqtt: ${installation.kind} done in ${duration}`);
  }
  this.emitInstallProgress();
}

module.exports = {
  finishInstallation,
};
