const logger = require('../../../utils/logger');

/**
 * @description Install Zigbee2mqtt with the stored setup, up to its first answer: the body of the installation job,
 * whose installation was started by the setup (see startInstallation).
 * @param {string} jobId - Id of the job, shown in the tasks of the settings.
 * @returns {Promise} Resolve once Zigbee2mqtt answers, reject when the installation fails.
 * @example
 * await this.runInstallation('18e1672b-af38-4148-a265-eea9b6549184');
 */
async function runInstallation(jobId) {
  this.installationJobId = jobId;
  try {
    await this.init(true);
    await this.waitForZigbee2mqtt();
  } catch (e) {
    logger.error('Zigbee2mqtt: installation failed:', e);
    this.finishInstallation(e);
    // The job is shown as failed
    throw e;
  }
  this.finishInstallation(null);
}

module.exports = {
  runInstallation,
};
