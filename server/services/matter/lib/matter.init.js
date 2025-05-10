const path = require('path');
const fse = require('fs-extra');

const logger = require('../../../utils/logger');

/**
 * @description This will init the Matter service.
 * @example matter.init();
 */
async function init() {
  const { Environment, StorageService, Logger, LogLevel } = this.MatterMain;
  const { CommissioningController } = this.ProjectChipMatter;

  // Reset memory
  this.commissioningController = null;

  // Store the matter data in the same folder as the Gladys database
  const storagePath = process.env.MATTER_FOLDER_PATH || path.join(path.dirname(this.gladys.config.storage), 'matter');
  logger.info(`Matter.init: storagePath: ${storagePath}`);
  // Create the storage folder if it doesn't exist
  await fse.ensureDir(storagePath);
  const environment = Environment.default;
  // Set the log level to "notice"
  // Log levels are defined here:
  // https://github.com/project-chip/matter.js/blob/b0ffc2ff3c8acd7fef19918337d4fd95dfa466e6/packages/general/src/log/LogLevel.ts
  Logger.level = LogLevel('notice');
  const storageService = environment.get(StorageService);
  storageService.location = storagePath;

  // Create the commissioning controller
  this.commissioningController = new CommissioningController({
    environment: {
      environment,
      id: 'matter-controller-data',
    },
    autoConnect: true,
    adminFabricLabel: 'Gladys Assistant',
    storage: storageService,
  });

  await this.commissioningController.start();
  logger.info('Matter controller started');
  await this.refreshDevices();
}

module.exports = {
  init,
};
