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
  // extract file name
  const fileWithoutSignedParams = fileUrl.split('?')[0];
  const encryptedBackupName = path.basename(fileWithoutSignedParams, '.enc');
  const restoreFolderPath = path.join(this.config.backupsFolder, RESTORE_FOLDER);
  const encryptedBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.enc`);
  const compressedBackupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.db.gz`);
  const backupFilePath = path.join(restoreFolderPath, `${encryptedBackupName}.db`);
  // we ensure the restore backup folder exists
  await fse.ensureDir(restoreFolderPath);
  // we empty the restore backup folder
  await fse.emptyDir(restoreFolderPath);
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
  // decompress backup
  await exec(`gzip -d ${compressedBackupFilePath}`);
  // done!
  logger.info(`Gladys backup downloaded with success.`);
  // send websocket event to indicate that
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.BACKUP.DOWNLOADED,
    payload: {
      backupFilePath,
    },
  });
  return {
    backupFilePath,
  };
}

module.exports = {
  downloadBackup,
};
