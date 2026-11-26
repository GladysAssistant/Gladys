const logger = require('../../../utils/logger');

/**
 * @description Install Zigbee2mqtt with the stored setup, up to its first answer: the body of the installation job,
 * whose installation was started by the setup or by a start (see startInstallation).
 * @param {boolean} setupMode - Init in setup mode (a setup), or as at the start of Gladys (a start).
 * @param {string} jobId - Id of the job, shown in the tasks of the settings (given by the job wrapper).
 * @returns {Promise} Resolve once Zigbee2mqtt answers, reject when the installation fails.
 * @example
 * await this.runInstallation(true, '18e1672b-af38-4148-a265-eea9b6549184');
 */
async function runInstallation(setupMode, jobId) {
  this.installationJobId = jobId;
  try {
    await this.init(setupMode);
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
