const fse = require('fs-extra');
const sqlite3Mod = require('sqlite3');
const duckdb = require('duckdb');
const path = require('path');
const { promisify } = require('util');

const db = require('../../models');
const logger = require('../../utils/logger');
const { execFile } = require('../../utils/childProcess');

/**
 * @description Restore a local backup archive (.tar.gz produced by createLocalBackup).
 * Validates the archive, extracts SQLite + DuckDB, restores both, then shuts down
 * so the process manager (Docker / systemd) can restart with the new data.
 * @param {string} archiveFilePath - Path to the uploaded .tar.gz backup file.
 * @returns {Promise<void>}
 * @example
 * await restoreLocalBackup('/tmp/gladysassistant/restore-upload/gladys-local-backup-2026-04-28.tar.gz');
 */
async function restoreLocalBackup(archiveFilePath) {
  const restoreDir = path.join(path.dirname(archiveFilePath), 'extracted');

  try {
    await fse.ensureDir(restoreDir);

    // Security: reject archives with absolute paths, ".." traversal or symlinks
    const pathsOnly = await execFile('tar', ['-tzf', archiveFilePath]);
    const hasUnsafePath = pathsOnly
      .split('\n')
      .filter(Boolean)
      .some((entry) => {
        const normalized = path.posix.normalize(entry);
        return path.posix.isAbsolute(entry) || normalized === '..' || normalized.startsWith('../');
      });

    const verboseList = await execFile('tar', ['-tzvf', archiveFilePath]);
    const hasSymlink = verboseList.split('\n').some((line) => line.startsWith('l'));

    if (hasUnsafePath || hasSymlink) {
      throw new Error('BACKUP_CONTAINS_UNSAFE_PATHS');
    }

    // Extract archive
    await execFile('tar', ['-xzf', archiveFilePath, '-C', restoreDir]);

    // Locate SQLite DB and DuckDB Parquet folder inside the extracted content
    const items = await fse.readdir(restoreDir);
    const sqliteFile = items.find((i) => i.endsWith('.db'));
    const parquetFolder = items.find((i) => {
      if (i === sqliteFile) {
        return false;
      }
      return fse.statSync(path.join(restoreDir, i)).isDirectory();
    });

    if (!sqliteFile) {
      throw new Error('NO_SQLITE_FILE_IN_BACKUP');
    }

    const sqliteBackupFilePath = path.join(restoreDir, sqliteFile);
    const duckDbBackupFolderPath = parquetFolder ? path.join(restoreDir, parquetFolder) : null;

    // Validate: the SQLite backup must contain at least one user
    logger.info('Local restore: validating SQLite backup');
    await new Promise((resolve, reject) => {
      const checkDb = new sqlite3Mod.Database(sqliteBackupFilePath, sqlite3Mod.OPEN_READONLY);
      const get = promisify(checkDb.get.bind(checkDb));
      get('SELECT id FROM t_user LIMIT 1')
        .then((row) => {
          checkDb.close();
          if (!row) {
            reject(new Error('NO_USER_FOUND_IN_NEW_DB'));
          } else {
            resolve();
          }
        })
        .catch((err) => {
          checkDb.close();
          reject(err);
        });
    });

    logger.info('Local restore: SQLite backup is valid, restoring');

    // Close Sequelize before replacing the DB file
    await db.sequelize.close();

    // Restore: open the backup file as source, copy to the current DB path
    const storagePath = path.resolve(this.config.storage);
    await new Promise((resolve, reject) => {
      const backupDb = new sqlite3Mod.Database(sqliteBackupFilePath);
      // filenameIsDest = true (default): this db is source, storagePath is destination
      const bkp = backupDb.backup(storagePath);
      bkp.step(-1, (err) => {
        bkp.finish();
        backupDb.close();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    logger.info('Local restore: SQLite restored');

    if (duckDbBackupFolderPath) {
      logger.info(`Local restore: Restoring DuckDB from ${duckDbBackupFolderPath}`);

      // Fix schema.sql — DuckDB IMPORT fails on built-in system schemas
      const schemaFilePath = path.join(duckDbBackupFolderPath, 'schema.sql');
      if (await fse.pathExists(schemaFilePath)) {
        let schema = await fse.readFile(schemaFilePath, 'utf-8');
        schema = schema.replace('CREATE SCHEMA information_schema;', '').replace('CREATE SCHEMA pg_catalog;', '');
        await fse.writeFile(schemaFilePath, schema);
      }

      // Close current DuckDB connection
      await new Promise((resolve) => {
        db.duckDb.close(() => resolve());
      });

      // Remove current DuckDB files so we start fresh
      const duckDbFilePath = storagePath.replace('.db', '.duckdb');
      await fse.remove(duckDbFilePath);
      await fse.remove(`${duckDbFilePath}.wal`);

      const newDuckDb = new duckdb.Database(duckDbFilePath);
      const conn = newDuckDb.connect();
      const allAsync = promisify(conn.all).bind(conn);
      await allAsync(`IMPORT DATABASE '${duckDbBackupFolderPath}'`);
      logger.info('Local restore: DuckDB restored');
      await new Promise((resolve) => {
        newDuckDb.close(() => resolve());
      });
    }

    logger.info('Local restore: complete — shutting down for process manager restart');
    this.shutdown();
  } finally {
    await fse.remove(archiveFilePath).catch(() => {});
    await fse.remove(restoreDir).catch(() => {});
  }
}

module.exports = {
  restoreLocalBackup,
};
