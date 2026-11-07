const { ConflictError } = require('../../../utils/coreErrors');
const { INSTALLATION_STATE, INSTALLATION_PHASE, INSTALLATION_PHASE_STATE } = require('./constants');

/**
 * @description Start following an installation of Zigbee2mqtt: its phases and its progress, sent to the setup page,
 * until finishInstallation tells its outcome.
 * @param {string} kind - What the installation does: install, update, or switch to another coordinator.
 * @example
 * this.startInstallation('install');
 */
function startInstallation(kind) {
  // Two installations would change the same containers at the same time
  if (this.installation.state === INSTALLATION_STATE.RUNNING) {
    throw new ConflictError('Zigbee2mqtt: an installation is already running');
  }
  this.installationStartedAt = Date.now();
  // Known once its job starts (see runInstallation)
  this.installationJobId = null;
  this.installationJobProgress = 0;
  this.installation = {
    state: INSTALLATION_STATE.RUNNING,
    kind,
    phases: Object.values(INSTALLATION_PHASE).map((key) => ({
      key,
      state: INSTALLATION_PHASE_STATE.PENDING,
      progress: 0,
    })),
    progress: 0,
    error: null,
    durationMs: null,
  };
  this.emitInstallProgress();
}

module.exports = {
  startInstallation,
};
