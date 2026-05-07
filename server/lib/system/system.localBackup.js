const sqlite3Mod = require('sqlite3');
const path = require('path');
const fse = require('fs-extra');
const db = require('../../models');
const logger = require('../../utils/logger');
const { execFile } = require('../../utils/childProcess');

const BACKUP_NAME_BASE = 'gladys-local-backup';

/**
 * @description Backup the SQLite database using the Node.js sqlite3 online backup API.
 * The online backup API handles WAL-mode databases natively without requiring a lock.
 * @param {string} storagePath - Absolute path to the source SQLite file.
 * @param {string} destPath - Absolute path for the destination backup file.
 * @returns {Promise<void>}
 */
function sqliteBackup(storagePath, destPath) {
  return new Promise((resolve, reject) => {
    const srcDb = new sqlite3Mod.Database(storagePath);
    // Prevent uncaught 'error' events: sqlite3.Database is an EventEmitter and
    // close() without a callback emits 'error' on failure, crashing Node.js.
    srcDb.on('error', (err) => {
      logger.warn(`Local backup: SQLite source db error: ${err.message}`);
    });
    const bkp = srcDb.backup(destPath);
    bkp.step(-1, (err) => {
      bkp.finish();
      // Use callback form so errors go to the callback, not an 'error' event
      srcDb.close((closeErr) => {
        if (closeErr) {
          logger.warn(`Local backup: SQLite source db close warning: ${closeErr.message}`);
        }
      });
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * @description Create a local backup archive (SQLite + DuckDB if available) and return its file path.
 * DuckDB export is optional: if it fails, the archive contains only the SQLite backup,
 * which holds all configuration (devices, scenes, dashboards, users, variables...).
 * The caller is responsible for deleting the temp directory after streaming the file.
 * @returns {Promise<string>} Path to the generated .tar.gz backup file.
 * @example
 * const filePath = await createLocalBackup();
 */
async function createLocalBackup() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const tempDir = path.join(this.config.tempFolder, 'local-backup', date);
  const sqliteBackupFileName = `${BACKUP_NAME_BASE}-${date}.db`;
  const sqliteBackupFilePath = path.join(tempDir, sqliteBackupFileName);
  const duckDbBackupFolder = `${BACKUP_NAME_BASE}_${date}_parquet`;
  const duckDbBackupFolderPath = path.join(tempDir, duckDbBackupFolder);
  const archiveFileName = `${BACKUP_NAME_BASE}-${date}.tar.gz`;
  const archiveFilePath = path.join(tempDir, archiveFileName);

  // Resolve storage path to absolute so sqlite3 can find it regardless of cwd
  const storagePath = path.resolve(this.config.storage);

  await fse.ensureDir(tempDir);

  try {
    // SQLite online backup API handles live databases natively — no lock needed
    logger.info(`Local backup: Backing up SQLite to ${sqliteBackupFilePath}`);
    await sqliteBackup(storagePath, sqliteBackupFilePath);

    // DuckDB backup to Parquet — optional, only contains sensor history
    let duckDbIncluded = false;
    try {
      logger.info(`Local backup: Exporting DuckDB to ${duckDbBackupFolderPath}`);
      const backupInstance = db.duckDbCreateBackupInstance();
      try {
        await backupInstance.allAsync(
          `EXPORT DATABASE '${duckDbBackupFolderPath}' (FORMAT PARQUET, COMPRESSION GZIP)`,
        );
        duckDbIncluded = true;
      } finally {
        await backupInstance.close().catch((e) => {
          logger.warn(`Local backup: DuckDB instance close warning: ${e.message}`);
        });
      }
    } catch (duckErr) {
      logger.warn(`Local backup: DuckDB export skipped (${duckErr.message}). Archive will contain SQLite only.`);
      await fse.remove(duckDbBackupFolderPath).catch(() => {});
    }

    // Compress everything (execFile avoids shell injection)
    logger.info('Local backup: Compressing archive');
    const tarArgs = ['-czf', archiveFilePath, '-C', tempDir, sqliteBackupFileName];
    if (duckDbIncluded) {
      tarArgs.push(duckDbBackupFolder);
    }
    await execFile('tar', tarArgs);

    logger.info(`Local backup: Archive ready at ${archiveFilePath} (DuckDB included: ${duckDbIncluded})`);
    return archiveFilePath;
  } catch (e) {
    await fse.remove(tempDir).catch(() => {});
    throw e;
  }
}

module.exports = {
  createLocalBackup,
};
