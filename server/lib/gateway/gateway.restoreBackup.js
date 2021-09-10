const fse = require('fs-extra');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Replace the local sqlite database with a backup.
 * @param {string} backupFilePath - The path of the backup.
 * @example
 * restoreBackup('/backup.db');
 */
async function restoreBackup(backupFilePath) {
  logger.info(`Restoring back up ${backupFilePath}`);
  // ensure that the file exists
  const exists = await fse.pathExists(backupFilePath);
  if (!exists) {
    throw new NotFoundError('BACKUP_NOT_FOUND');
  }
  logger.info('Testing if backup is a valid Gladys SQLite database.');
  // Testing if the backup is a valid backup
  const potentialNewDb = new sqlite3.Database(backupFilePath);
  const getAsync = promisify(potentialNewDb.get.bind(potentialNewDb));
  const closeAsync = promisify(potentialNewDb.close.bind(potentialNewDb));
  // Getting the new user
  const rows = await getAsync('SELECT id, email FROM t_user');
  if (!rows || rows.length === 0) {
    throw new NotFoundError('NO_USER_FOUND_IN_NEW_DB');
  }
  // closing the new DB
  await closeAsync();
  logger.info('Backup seems to be a valid file. Restoring.');
  // shutting down the current DB
  await this.sequelize.close();
  // copy the backupFile to the new DB
  await exec(`sqlite3 ${this.config.storage} ".restore '${backupFilePath}'"`);
  // done!
  logger.info(`Backup restored. Need reboot now.`);
}

module.exports = {
  restoreBackup,
};
