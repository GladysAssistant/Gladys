const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { execFile, spawnToFile } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');
const { assertSafeBackupName, isSafeArchiveEntry } = require('../../utils/backupSafety');

const RESTORE_FOLDER = 'restore';
// thrown by the checks that must never fall back to the old restore strategy:
// a rejected archive is a rejected backup, not a backup to try another way
const UNSAFE_BACKUP_ERRORS = ['BACKUP_CONTAINS_UNSAFE_PATHS', 'BACKUP_UNSAFE_FILE_NAME'];

/**
 * @description Restore a backup.
 * @param {string} fileUrl - The url of the backup.
 * @returns {Promise<object>} Resolve when backup is downloaded.
 * @example
 * restoreBackup();
 */
async function downloadBackup(fileUrl) {
  const encryptKey = await this.variable.getValue('GLADYS_GATEWAY_BACKUP_KEY');
  if (encryptKey === null) {
    throw new NotFoundError('GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
  }
  // Extract file name
  const fileWithoutSignedParams = fileUrl.split('?')[0];
  const restoreFolderPath = path.join(this.config.backupsFolder, RESTORE_FOLDER);
  // we ensure the restore backup folder exists
  await fse.ensureDir(restoreFolderPath);
  // we empty the restore backup folder
  await fse.emptyDir(restoreFolderPath);

  // the name comes from a URL the caller chose: `path.basename` stops a path
  // traversal but keeps every shell and SQL metacharacter, and this name ends up
  // building the paths handed to gzip, sqlite3 and DuckDB below
  const encryptedBackupName = assertSafeBackupName(path.basename(fileWithoutSignedParams, '.enc'));
  const encryptedBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.enc`);
  const compressedBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.gz`);

  let duckDbBackupFolderPath = null;
  let sqliteBackupFilePath = null;

  // we create a stream
  const writeStream = fs.createWriteStream(encryptedBackupFilePath);
  // and download the backup file
  await this.gladysGatewayClient.downloadBackup(fileUrl, writeStream, (progressEvent) => {
    logger.debug(`Download backup progress, ${progressEvent.loaded} / ${progressEvent.total}`);
  });
  // decrypt backup
  await execFile('openssl', [
    'enc',
    '-aes-256-cbc',
    '-pass',
    `pass:${encryptKey}`,
    '-d',
    '-in',
    encryptedBackupFilePath,
    '-out',
    compressedBackupFilePath,
  ]);

  try {
    logger.info(`Trying to restore the backup new style (DuckDB)`);
    // Check archive for path traversal attempts and symlinks
    const tarEntries = await execFile('tar', ['-tzf', compressedBackupFilePath]);
    // every entry must be a plain relative name: this rejects path traversal and
    // absolute paths, and also the quotes, `$`, backticks and semicolons that
    // would otherwise reach sqlite3 and DuckDB through the extracted file names
    const hasUnsafePath = tarEntries
      .split('\n')
      .filter(Boolean)
      .some((entry) => !isSafeArchiveEntry(entry));
    const tarList = await execFile('tar', ['-tzvf', compressedBackupFilePath]);
    const hasSymlink = tarList.split('\n').some((line) => line.startsWith('l'));
    if (hasUnsafePath || hasSymlink) {
      throw new Error('BACKUP_CONTAINS_UNSAFE_PATHS');
    }
    await execFile('tar', ['-xzvf', compressedBackupFilePath, '-C', restoreFolderPath]);
    logger.info("Extracting worked. It's a DuckDB export.");
    const itemsInFolder = await fse.readdir(restoreFolderPath);
    sqliteBackupFilePath = path.join(
      restoreFolderPath,
      itemsInFolder.find((i) => i.endsWith('.db')),
    );
    duckDbBackupFolderPath = path.join(
      restoreFolderPath,
      itemsInFolder.find((i) => i.endsWith('_parquet_folder')),
    );
  } catch (e) {
    // Re-throw security errors - don't fall back to old strategy
    if (UNSAFE_BACKUP_ERRORS.includes(e.message)) {
      throw e;
    }
    logger.info(`Extracting failed using new strategy (Error: ${e})`);
    logger.info(`Restoring using old backup strategy (SQLite only)`);
    sqliteBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.db`);
    // no shell here: the redirection is a write stream, so the backup name can
    // never be read as a command
    await spawnToFile('gzip', ['-dc', compressedBackupFilePath], sqliteBackupFilePath);
  }
  // done!
  logger.info(`Gladys backup downloaded with success.`);
  // send websocket event to indicate that
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.BACKUP.DOWNLOADED,
    payload: {
      sqliteBackupFilePath,
      duckDbBackupFolderPath,
    },
  });
  return {
    sqliteBackupFilePath,
    duckDbBackupFolderPath,
  };
}

module.exports = {
  downloadBackup,
};
