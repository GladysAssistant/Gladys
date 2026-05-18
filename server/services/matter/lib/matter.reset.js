const path = require('path');
const fse = require('fs-extra');

const logger = require('../../../utils/logger');
const { VARIABLES } = require('../utils/constants');

/**
 * @description Reset the Matter integration to factory defaults.
 * This will delete all controller data, backup, and matter folder.
 * @example
 * await matter.reset();
 */
async function reset() {
  logger.info('Matter: resetting integration...');

  // 1. Stop the Matter controller
  await this.stop();

  // 2. Delete the Matter backup variable from database
  await this.gladys.variable.destroy(VARIABLES.MATTER_BACKUP, this.serviceId);
  logger.info('Matter: backup variable deleted');

  // 3. Set MATTER_ENABLED to false
  await this.gladys.variable.setValue(VARIABLES.MATTER_ENABLED, 'false', this.serviceId);
  logger.info('Matter: MATTER_ENABLED set to false');

  // 4. Delete the Matter folder on disk
  const storagePath = process.env.MATTER_FOLDER_PATH || path.join(path.dirname(this.gladys.config.storage), 'matter');
  await fse.remove(storagePath);
  logger.info('Matter: folder deleted successfully');

  // 5. Reset in-memory state
  this.commissioningController = null;
  this.devices = [];
  this.nodesMap = new Map();
  this.stateChangeListeners = new Set();

  logger.info('Matter: integration reset complete');
}

module.exports = {
  reset,
};
