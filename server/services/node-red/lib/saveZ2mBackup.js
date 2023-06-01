const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Save Z2M backup.
 * @param {object} payload - Z2M MQTT backup payload.
 * @returns {Promise} The status of backup JOB, or null.
 * @example
 * await z2m.saveZ2mBackup({ status: 'ok', data: { zip: 'base64_backup' }});
 */
async function saveZ2mBackup(payload) {
  logger.info('Zigbee2mqtt: storing backup...');

  const { jobId, resolve: jobResolver, reject: jobRejecter } = this.backupJob;
  if (jobId) {
    await this.gladys.job.updateProgress(jobId, 60);
  }

  const { status, data } = payload;
  const backupValid = status === 'ok';

  if (backupValid) {
    await this.gladys.variable.setValue(CONFIGURATION.Z2M_BACKUP, data.zip, this.serviceId);
    logger.info('Zigbee2mqtt: backup stored');

    if (jobId) {
      await this.gladys.job.updateProgress(jobId, 100);
    }
  } else {
    logger.error('zigbee2mqtt backup is not ok');
  }

  if (backupValid && jobResolver) {
    return jobResolver();
  }
  if (!backupValid && jobRejecter) {
    return jobRejecter();
  }

  return null;
}

module.exports = {
  saveZ2mBackup,
};
