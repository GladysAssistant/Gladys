const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

/**
 * @description Create a Z2M backup.
 * @param {string} jobId - The job id.
 * @returns {Promise} - Resolve when backup is finished.
 * @example
 * backup('aaf45861-c7f5-47ac-bde1-cfe56c7789cf');
 */
async function backup(jobId) {
  // Backup is not possible when service is not running
  if (!this.isEnabled()) {
    throw new ServiceNotConfiguredError('SERVICE_NOT_CONFIGURED');
  }

  const finishJob = (func, timer, args) => {
    if (timer) {
      clearTimeout(timer);
    }

    // reset pending job
    this.backupJob = {};
    return func(args);
  };

  const response = new Promise((resolve, reject) => {
    // Prevent infinite wait
    const timerId = setTimeout(finishJob, 30000, reject, null, "Backup request time's out");

    this.backupJob = {
      resolve: (args) => finishJob(resolve, timerId, args),
      reject: (args) => finishJob(reject, timerId, args),
      jobId,
    };
  });

  // Request z2m to generate a new backup.
  logger.info('Zigbee2MQTT request for backup');
  await this.gladys.job.updateProgress(jobId, 30);
  this.mqttClient.publish('zigbee2mqtt/bridge/request/backup');

  return response;
}

module.exports = {
  backup,
};
