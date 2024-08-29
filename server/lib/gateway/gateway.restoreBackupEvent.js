const logger = require('../../utils/logger');

/**
 * @description Restore a backup.
 * @param {object} event - An event.
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
    const { sqliteBackupFilePath, duckDbBackupFolderPath } = await this.downloadBackup(event.file_url);
    await this.restoreBackup(sqliteBackupFilePath, duckDbBackupFolderPath);
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
