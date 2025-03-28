const path = require('path');
const fse = require('fs-extra');

const { convertToGladysDevice } = require('../utils/convertToGladysDevice');
const logger = require('../../../utils/logger');

/**
 * @description This will init the Matter service.
 * @example matter.init();
 */
async function init() {
  const { Environment, StorageService } = this.MatterMain;
  const { CommissioningController } = this.ProjectChipMatter;
  // Store the matter data in the same folder as the Gladys database
  const storagePath = path.join(path.dirname(this.gladys.config.storage), 'matter');
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
  nodeDetails.forEach(async (nodeDetail) => {
    const node = await this.commissioningController.getNode(nodeDetail.nodeId);
    const devices = node.getDevices();
    devices.forEach(async (device) => {
      const gladysDevice = await convertToGladysDevice(
        this.serviceId,
        nodeDetail.nodeId,
        node,
        device,
        nodeDetail.deviceData,
      );
      this.nodesMap.set(nodeDetail.nodeId, node);
      this.devices.push(gladysDevice);
    });
  });
}

module.exports = {
  init,
};
