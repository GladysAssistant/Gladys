const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { exec, execFile } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');

const RESTORE_FOLDER = 'restore';

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

  const encryptedBackupName = path.basename(fileWithoutSignedParams, '.enc');
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
    const hasUnsafePath = tarEntries
      .split('\n')
      .filter(Boolean)
      .some((entry) => {
        const normalized = path.posix.normalize(entry);
        return path.posix.isAbsolute(entry) || normalized === '..' || normalized.startsWith('../');
      });
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
    if (e.message === 'BACKUP_CONTAINS_UNSAFE_PATHS') {
      throw e;
    }
    logger.info(`Extracting failed using new strategy (Error: ${e})`);
    logger.info(`Restoring using old backup strategy (SQLite only)`);
    sqliteBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.db`);
    await exec(`gzip -dc ${compressedBackupFilePath} > ${sqliteBackupFilePath}`);
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
