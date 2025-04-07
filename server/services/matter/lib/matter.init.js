const path = require('path');
const fse = require('fs-extra');
const Promise = require('bluebird');

const logger = require('../../../utils/logger');

/**
 * @description This will init the Matter service.
 * @example matter.init();
 */
async function init() {
  const { Environment, StorageService } = this.MatterMain;
  const { CommissioningController } = this.ProjectChipMatter;

  // Store the matter data in the same folder as the Gladys database
  const storagePath = process.env.MATTER_FOLDER_PATH || path.join(path.dirname(this.gladys.config.storage), 'matter');
  logger.info(`Matter.init: storagePath: ${storagePath}`);
  // Create the storage folder if it doesn't exist
  await fse.ensureDir(storagePath);
  const environment = Environment.default;
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
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();

  await Promise.each(nodeDetails, async (nodeDetail) => {
    await this.handleNode(nodeDetail);
  });
}

module.exports = {
  init,
};
