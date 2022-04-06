const Sequelize = require('sequelize');
const path = require('path');
const fse = require('fs-extra');
const fs = require('fs');
const fsPromise = require('fs').promises;
const FormData = require('form-data');
const retry = require('async-retry');
const db = require('../../models');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');
const { NotFoundError } = require('../../utils/coreErrors');

const BACKUP_NAME_BASE = 'gladys-db-backup';

const RETRY_OPTIONS = {
  retries: 3,
  factor: 2,
  minTimeout: 2000,
};

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
  // we lock the database
  logger.info(`Gateway backup: Locking Database`);
  // It's possible to get "Cannot start a transaction within a transaction" errors
  // So we might want to retry this part a few times
  await retry(async (bail, attempt) => {
    await db.sequelize.transaction({ type: Sequelize.Transaction.TYPES.IMMEDIATE }, async () => {
      logger.info(`Backup attempt n°${attempt} : Cleaning backup folder`);
      // we delete old backups
      await fse.emptyDir(this.config.backupsFolder);
      // We backup database
      logger.info(`Starting Gateway backup in folder ${backupFilePath}`);
      await exec(`sqlite3 ${this.config.storage} ".backup '${backupFilePath}'"`);
      logger.info(`Gateway backup: Unlocking Database`);
    });
  }, RETRY_OPTIONS);
  const fileInfos = await fsPromise.stat(backupFilePath);
  const fileSizeMB = Math.round(fileInfos.size / 1024 / 1024);
  logger.info(`Gateway backup : Success! File size is ${fileSizeMB}mb.`);
  // compress backup
  logger.info(`Gateway backup: Gzipping backup`);
  await exec(`gzip ${backupFilePath}`);
  // encrypt backup
  logger.info(`Gateway backup: Encrypting backup`);
  await exec(
    `openssl enc -aes-256-cbc -pass pass:${encryptKey} -in ${compressedBackupFilePath} -out ${encryptedBackupFilePath}`,
  );
  // Read backup file in stream
  const form = new FormData();
  form.append('upload', fs.createReadStream(encryptedBackupFilePath));
  // and upload it to the Gladys Gateway
  logger.info(`Gateway backup: Uploading backup`);
  await this.gladysGatewayClient.uploadBackup(form, (progressEvent) => {
    logger.info(`Gladys Plus backup: Upload backup progress, ${progressEvent.loaded} / ${progressEvent.total}`);
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
