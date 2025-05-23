const path = require('path');
const fse = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { VARIABLES } = require('../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description This function restore the controller.
 * @returns {Promise<void>}
 * @example
 * await restoreBackup();
 */
async function restoreBackup() {
  const backupContent = await this.gladys.variable.getValue(VARIABLES.MATTER_BACKUP, this.serviceId);
  if (!backupContent) {
    logger.info('Matter.restoreBackup: no backup found');
    return;
  }
  logger.info('Matter.restoreBackup: backup found, restoring...');
  const storagePath = process.env.MATTER_FOLDER_PATH || path.join(path.dirname(this.gladys.config.storage), 'matter');
  await fse.ensureDir(storagePath);
  const backupPath = path.join(path.dirname(storagePath), 'matter-backup.tar.gz');
  await fse.writeFile(backupPath, backupContent, 'base64');
  await exec(`tar -xzf ${backupPath} -C ${path.dirname(storagePath)}`, {
    timeout: 60000,
  });
  await fse.remove(backupPath);
  logger.info('Matter.restoreBackup: backup restored');
}

module.exports = {
  restoreBackup,
};
