const { INSTALLATION_STATE, INSTALLATION_PHASE_STATE, INSTALLATION_PHASE_WEIGHTS } = require('./constants');

const TOTAL_WEIGHT = Object.values(INSTALLATION_PHASE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

/**
 * @description Update a phase of the running installation, and its overall progress. Without effect outside an
 * installation: the containers are also installed when Gladys starts, with nobody to follow it.
 * @param {string} key - Key of the phase, see INSTALLATION_PHASE.
 * @param {object} update - New state of the phase.
 * @param {string} update.state - State of the phase, see INSTALLATION_PHASE_STATE.
 * @param {number} [update.progress] - Progress of the phase in percent, while it runs.
 * @example
 * this.updateInstallationPhase('pull_z2m', { state: 'running', progress: 42 });
 */
function updateInstallationPhase(key, { state, progress = 0 }) {
  if (this.installation.state !== INSTALLATION_STATE.RUNNING) {
    return;
  }
  const phase = this.installation.phases.find((installationPhase) => installationPhase.key === key);
  // Skipped means that nothing was done: a phase done again, like by the ezsp fallback, keeps its state
  if (state === INSTALLATION_PHASE_STATE.SKIPPED && phase.state !== INSTALLATION_PHASE_STATE.PENDING) {
    return;
  }
  phase.state = state;
  const finished = state === INSTALLATION_PHASE_STATE.DONE || state === INSTALLATION_PHASE_STATE.SKIPPED;
  // Never backwards: a pull discovers the size of the layers as it goes
  phase.progress = Math.max(phase.progress, finished ? 100 : progress);
  const weightedProgress = this.installation.phases.reduce(
    (sum, installationPhase) => sum + INSTALLATION_PHASE_WEIGHTS[installationPhase.key] * installationPhase.progress,
    0,
  );
  this.installation.progress = Math.max(this.installation.progress, Math.floor(weightedProgress / TOTAL_WEIGHT));
  this.emitInstallProgress();
}

module.exports = {
  updateInstallationPhase,
};
