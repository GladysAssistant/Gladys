const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { exec } = require('../../utils/childProcess');
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

  const isBackupWithDuckDb = fileWithoutSignedParams.includes('.tar.gz');
  const encryptedBackupName = path.basename(fileWithoutSignedParams, '.enc');
  const encryptedBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.enc`);
  const compressedBackupFilePath = path.join(
    restoreFolderPath,
    isBackupWithDuckDb ? encryptedBackupName : `${encryptedBackupName}.db.gz`,
  );

  let duckDbBackupFolderPath = null;
  let sqliteBackupFilePath = null;

  // we create a stream
  const writeStream = fs.createWriteStream(encryptedBackupFilePath);
  // and download the backup file
  await this.gladysGatewayClient.downloadBackup(fileUrl, writeStream, (progressEvent) => {
    logger.debug(`Download backup progress, ${progressEvent.loaded} / ${progressEvent.total}`);
  });
  // decrypt backup
  await exec(
    `openssl enc -aes-256-cbc -pass pass:${encryptKey} -d -in ${encryptedBackupFilePath} -out ${compressedBackupFilePath}`,
  );
  // Decompress backup using either tar (in case it's a new style backup)
  // or with GZIP (if it's just a SQLite file)
  if (isBackupWithDuckDb) {
    logger.info(`Restoring backup with DuckDB database. Extracting ${compressedBackupFilePath}`);
    await exec(`cd ${restoreFolderPath} && tar -xzvf ${encryptedBackupName}`);
    const itemsInFolder = await fse.readdir(restoreFolderPath);
    sqliteBackupFilePath = path.join(
      restoreFolderPath,
      itemsInFolder.find((i) => i.endsWith('.db')),
    );
    duckDbBackupFolderPath = path.join(
      restoreFolderPath,
      itemsInFolder.find((i) => i.endsWith('_parquet_folder')),
    );
  } else {
    logger.info(`Restoring old backup (SQLite only)`);
    await exec(`gzip -d ${compressedBackupFilePath}`);
    sqliteBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.db`);
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
