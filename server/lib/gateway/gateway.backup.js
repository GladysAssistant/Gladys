const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const FormData = require('form-data');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');

const BACKUP_NAME_BASE = 'gladys-db-backup';

/**
 * @description Create a backup and upload it to the Gateway
 * @example
 * backup();
 */
async function backup() {
  const encryptKey = await this.variable.getValue('GLADYS_GATEWAY_BACKUP_KEY');
  if (encryptKey === null) {
    throw new NotFoundError('GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
  }
  const now = new Date();
  const date = `${now.getFullYear()}-${now.getMonth() +
    1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const backupFileName = `${BACKUP_NAME_BASE}-${date}.db`;
  const backupFilePath = path.join(this.config.backupsFolder, backupFileName);
  const compressedBackupFilePath = `${backupFilePath}.gz`;
  const encryptedBackupFilePath = `${compressedBackupFilePath}.enc`;
  // we ensure the backup folder exists
  await fse.ensureDir(this.config.backupsFolder);
  // we delete old backups
  await fse.emptyDir(this.config.backupsFolder);
  // backup database
  await exec(`sqlite3 ${this.config.storage} ".backup '${backupFilePath}'"`);
  // compress backup
  await exec(`gzip ${backupFilePath}`);
  // encrypt backup
  await exec(
    `openssl enc -aes-256-cbc -pass pass:${encryptKey} -in ${compressedBackupFilePath} -out ${encryptedBackupFilePath}`,
  );
  // Read backup file in stream
  const form = new FormData();
  form.append('upload', fs.createReadStream(encryptedBackupFilePath));
  // and upload it to the Gladys Gateway
  await this.gladysGatewayClient.uploadBackup(form, (progressEvent) => {
    logger.debug(`Upload backup progress, ${progressEvent.loaded} / ${progressEvent.total}`);
  });
  // done!
  logger.info(`Gladys backup uploaded with success to Gladys Gateway. ${backupFileName}`);
  return {
    encryptedBackupFilePath,
  };
}

module.exports = {
  backup,
};
