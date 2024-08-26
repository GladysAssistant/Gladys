const Sequelize = require('sequelize');
const path = require('path');
const fse = require('fs-extra');
const Promise = require('bluebird');
const fsPromise = require('fs').promises;
const retry = require('async-retry');
const db = require('../../models');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');
const { readChunk } = require('../../utils/readChunk');
const { NotFoundError } = require('../../utils/coreErrors');
const { USER_ROLE } = require('../../utils/constants');

const BACKUP_NAME_BASE = 'gladys-db-backup';

const SQLITE_BACKUP_RETRY_OPTIONS = {
  retries: 3,
  factor: 2,
  minTimeout: 2000,
};

const UPLOAD_ONE_CHUNK_RETRY_OPTIONS = {
  retries: 4,
  factor: 2,
  minTimeout: 50,
};

/**
 * @description Create a backup and upload it to the Gateway.
 * @param {string} jobId - The job id.
 * @returns {Promise} - Resolve when backup is finished.
 * @example
 * backup();
 */
async function backup(jobId) {
  try {
    const encryptKey = await this.variable.getValue('GLADYS_GATEWAY_BACKUP_KEY');
    if (encryptKey === null) {
      throw new NotFoundError('GLADYS_GATEWAY_BACKUP_KEY_NOT_FOUND');
    }
    const systemInfos = await this.system.getInfos();
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() +
      1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const sqliteBackupFileName = `${BACKUP_NAME_BASE}-${date}.db`;
    const sqliteBackupFilePath = path.join(this.config.backupsFolder, sqliteBackupFileName);
    const duckDbBackupFolder = `${BACKUP_NAME_BASE}_${date}_parquet_folder`;
    const duckDbBackupFolderPath = path.join(this.config.backupsFolder, duckDbBackupFolder);
    const compressedBackupFileName = `${BACKUP_NAME_BASE}-${date}.tar.gz`;
    const compressedBackupFilePath = path.join(this.config.backupsFolder, compressedBackupFileName);
    const encryptedBackupFilePath = `${compressedBackupFilePath}.enc`;
    // we ensure the backup folder exists
    await fse.ensureDir(this.config.backupsFolder);
    // we lock the database
    logger.info(`Gateway backup: Locking SQLite Database`);
    // It's possible to get "Cannot start a transaction within a transaction" errors
    // So we might want to retry this part a few times
    await retry(async (bail, attempt) => {
      await db.sequelize.transaction({ type: Sequelize.Transaction.TYPES.IMMEDIATE }, async () => {
        logger.info(`Backup attempt n°${attempt} : Cleaning backup folder`);
        // we delete old backups
        await fse.emptyDir(this.config.backupsFolder);
        // We backup database
        logger.info(`Starting Gateway backup in folder ${sqliteBackupFilePath}`);
        await exec(`sqlite3 ${this.config.storage} ".backup '${sqliteBackupFilePath}'"`);
        logger.info(`Gateway backup: Unlocking Database`);
      });
    }, SQLITE_BACKUP_RETRY_OPTIONS);
    await this.job.updateProgress(jobId, 10);
    const fileInfos = await fsPromise.stat(sqliteBackupFilePath);
    const fileSizeMB = Math.round(fileInfos.size / 1024 / 1024);
    logger.info(`Gateway backup : SQLite file size is ${fileSizeMB}mb.`);
    logger.info(`Gateway backup : Backing up DuckDB into a Parquet folder ${duckDbBackupFolderPath}`);
    // DuckDB backup to parquet file
    await db.duckDbWriteConnectionAllAsync(
      ` EXPORT DATABASE '${duckDbBackupFolderPath}' (
          FORMAT PARQUET,
          COMPRESSION GZIP
      )`,
    );
    // compress backup
    logger.info(`Gateway backup: Compressing backup`);
    await exec(
      `cd ${this.config.backupsFolder} && tar -czvf ${compressedBackupFileName} ${sqliteBackupFileName} ${duckDbBackupFolder}`,
    );
    await this.job.updateProgress(jobId, 20);
    // encrypt backup
    logger.info(`Gateway backup: Encrypting backup`);
    await exec(
      `openssl enc -aes-256-cbc -pass pass:${encryptKey} -in ${compressedBackupFilePath} -out ${encryptedBackupFilePath}`,
    );
    await this.job.updateProgress(jobId, 30);
    // Upload file to the Gladys Gateway
    const encryptedFileInfos = await fsPromise.stat(encryptedBackupFilePath);
    logger.info(
      `Gateway backup: Uploading backup, size of encrypted backup = ${Math.round(
        encryptedFileInfos.size / 1024 / 1024,
      )}mb. Path = ${encryptedBackupFilePath}`,
    );
    const initializeBackupResponse = await this.gladysGatewayClient.initializeMultiPartBackup({
      file_size: encryptedFileInfos.size,
    });
    try {
      const totalOfChunksToUpload = initializeBackupResponse.parts.length;

      const partsUploaded = await Promise.mapSeries(initializeBackupResponse.parts, async (part, index) => {
        const startPosition = index * initializeBackupResponse.chunk_size;
        const chunk = await readChunk(encryptedBackupFilePath, {
          length: initializeBackupResponse.chunk_size,
          startPosition,
        });

        // each chunk is retried
        const partUploaded = await retry(async () => {
          const { headers } = await this.gladysGatewayClient.uploadOneBackupChunk(
            part.signed_url,
            chunk,
            systemInfos.gladys_version,
          );
          return {
            PartNumber: part.part_number,
            ETag: headers.etag.replace(/"/g, ''),
          };
        }, UPLOAD_ONE_CHUNK_RETRY_OPTIONS);

        const percent = Math.round(30 + (((index + 1) * 100) / totalOfChunksToUpload) * 0.7);
        await this.job.updateProgress(jobId, percent);

        return partUploaded;
      });
      await this.gladysGatewayClient.finalizeMultiPartBackup({
        file_key: initializeBackupResponse.file_key,
        file_id: initializeBackupResponse.file_id,
        parts: partsUploaded,
        backup_id: initializeBackupResponse.backup_id,
      });
      await this.job.updateProgress(jobId, 100);
      // done!
      logger.info(`Gladys backup uploaded with success to Gladys Gateway.`);
    } catch (e) {
      await this.gladysGatewayClient.abortMultiPartBackup({
        file_key: initializeBackupResponse.file_key,
        file_id: initializeBackupResponse.file_id,
        backup_id: initializeBackupResponse.backup_id,
      });
      throw e;
    }
    return {
      encryptedBackupFilePath,
    };
  } catch (e) {
    // If the backup fails, we need to warn the admins of this installation
    const admins = await this.user.getByRole(USER_ROLE.ADMIN);
    admins.forEach((admin) => {
      const message = this.brain.getReply(admin.language, 'backup.fail', {
        errorMessage: e.toString(),
      });
      this.message.sendToUser(admin.selector, message);
    });
    throw e;
  }
}

module.exports = {
  backup,
};
