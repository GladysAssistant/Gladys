const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { VARIABLES } = require('../utils/constants');

/**
 * @description This function backup the controller.
 * @param {string} jobId - Job ID.
 * @example
 * await backupController(jobId);
 */
async function backupController(jobId) {
  if (!this.commissioningController) {
    logger.debug('Matter controller is not initialized');
    return;
  }
  logger.info('Matter.backupController: backing up Matter controller, stopping Matter service');
  await this.stop();
  await this.gladys.job.updateProgress(jobId, 25);
  const storagePath = process.env.MATTER_FOLDER_PATH || path.join(path.dirname(this.gladys.config.storage), 'matter');
  // Make a tar.gz of the storage folder
  const backupPath = path.join(path.dirname(storagePath), 'matter-backup.tar.gz');

  logger.info(`Matter.backupController: backupPath: ${backupPath}`);
  logger.info(`Matter.backupController: storagePath: ${storagePath}`);
  await exec(`tar -czf ${backupPath} -C ${path.dirname(storagePath)} ${path.basename(storagePath)}`, {
    timeout: 60000,
  });
  await this.gladys.job.updateProgress(jobId, 50);
  logger.info(`Matter.backupController: backup created at ${backupPath}`);
  const backupContent = await fse.readFile(backupPath, 'base64');
  logger.info(`Matter.backupController: backup size: ${backupContent.length} bytes`);
  await this.gladys.variable.setValue(VARIABLES.MATTER_BACKUP, backupContent, this.serviceId);
  await fse.remove(backupPath);
  await this.gladys.job.updateProgress(jobId, 75);
  logger.info('Matter.backupController: backup saved, restarting Matter service');
  await this.init();
  await this.gladys.job.updateProgress(jobId, 100);
}

module.exports = {
  backupController,
};
