const fse = require('fs-extra');
const sqlite3 = require('sqlite3');
const duckdb = require('duckdb');
const path = require('path');

const { promisify } = require('util');

const db = require('../../models');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Replace the local sqlite database with a backup.
 * @param {string} sqliteBackupFilePath - The path of the sqlite backup.
 * @param {string} [duckDbBackupFolderPath] - The path of the DuckDB backup folder.
 * @example
 * restoreBackup('/backup.db');
 */
async function restoreBackup(sqliteBackupFilePath, duckDbBackupFolderPath) {
  logger.info(`Restoring back up ${sqliteBackupFilePath} / ${duckDbBackupFolderPath}`);
  // ensure that the file exists
  const sqliteBackupExists = await fse.pathExists(sqliteBackupFilePath);
  if (!sqliteBackupExists) {
    throw new NotFoundError('BACKUP_NOT_FOUND');
  }
  logger.info('Testing if backup is a valid Gladys SQLite database.');
  // Testing if the backup is a valid backup
  const potentialNewDb = new sqlite3.Database(sqliteBackupFilePath);
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
  await exec(`sqlite3 ${this.config.storage} ".restore '${sqliteBackupFilePath}'"`);
  // done!
  logger.info(`SQLite backup restored`);
  if (duckDbBackupFolderPath) {
    // Closing DuckDB current database
    logger.info(`Restoring DuckDB folder ${duckDbBackupFolderPath}`);
    await new Promise((resolve) => {
      db.duckDb.close(() => resolve());
    });
    // Delete current DuckDB files
    const duckDbFilePath = `${this.config.storage.replace('.db', '')}.duckdb`;
    const duckDbWalFilePath = `${this.config.storage.replace('.db', '')}.duckdb.wal`;
    await fse.remove(duckDbFilePath);
    await fse.remove(duckDbWalFilePath);
    const duckDb = new duckdb.Database(duckDbFilePath);
    const duckDbWriteConnection = duckDb.connect();
    const duckDbWriteConnectionAllAsync = promisify(duckDbWriteConnection.all).bind(duckDbWriteConnection);
    const schemaFilePath = path.join(duckDbBackupFolderPath, 'schema.sql');
    const schema = await fse.readFile(schemaFilePath, 'utf-8');
    const schemaCleaned = schema
      .replace('CREATE SCHEMA information_schema;', '')
      .replace('CREATE SCHEMA pg_catalog;', '');
    await fse.writeFile(schemaFilePath, schemaCleaned);
    await duckDbWriteConnectionAllAsync(`IMPORT DATABASE '${duckDbBackupFolderPath}'`);
    logger.info(`DuckDB restored with success`);
    await new Promise((resolve) => {
      duckDb.close(() => resolve());
    });
  }
}

module.exports = {
  restoreBackup,
};
