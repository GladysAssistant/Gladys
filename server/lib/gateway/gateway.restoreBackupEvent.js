const logger = require('../../utils/logger');

/**
 * @description Restore a backup.
 * @param {Object} event - An event.
 * @example
 * restoreBackupEvent({
 *  file_url: 'https://backup-example'
 * });
 */
async function restoreBackupEvent(event) {
  try {
    this.restoreErrored = false;
    this.restoreInProgress = true;
    logger.info(`Receiving restore backup event. File url = ${event.file_url}`);
    const { backupFilePath } = await this.downloadBackup(event.file_url);
    await this.restoreBackup(backupFilePath);
    await this.system.shutdown();
  } catch (e) {
    logger.warn(e);
    this.restoreInProgress = false;
    this.restoreErrored = true;
  }
}

module.exports = {
  restoreBackupEvent,
};
