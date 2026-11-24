const { INSTALLATION_STATE, getIdleInstallation } = require('./constants');

/**
 * @description Forget the outcome of the last installation once it no longer describes Zigbee2mqtt, and send the idle
 * installation to the setup page. A running installation goes on, and tells its own outcome.
 * @example
 * this.clearInstallation();
 */
function clearInstallation() {
  const { state } = this.installation;
  if (state !== INSTALLATION_STATE.DONE && state !== INSTALLATION_STATE.FAILED) {
    return;
  }
  this.installation = getIdleInstallation();
  // Its job is over: the progress of the idle installation must not go to it (see emitInstallProgress)
  this.installationJobId = null;
  this.installationJobProgress = 0;
  this.emitInstallProgress();
}

module.exports = {
  clearInstallation,
};
