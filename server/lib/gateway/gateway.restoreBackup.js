const fse = require('fs-extra');
const logger = require('../../utils/logger');

const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Replace the local sqlite database with a backup.
 * @param {string} backupFilePath - The path of the backup.
 * @example
 * restoreBackup('/backup.db');
 */
async function restoreBackup(backupFilePath) {
  logger.debug(`Restoring back up ${backupFilePath}`);
  // ensure that the file exists
  const exists = await fse.pathExists(backupFilePath);
  if (!exists) {
    throw new NotFoundError('BACKUP_NOT_FOUND');
  }
  // shutting down the DB
  await this.sequelize.close();
  // copy the backupFile to the new DB
  await fse.copy(backupFilePath, this.config.storage);
  // done!
  logger.debug(`Backup restored. Need reboot now.`);
}

module.exports = {
  restoreBackup,
};
