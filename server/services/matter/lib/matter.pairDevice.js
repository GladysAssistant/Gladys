const { ManualPairingCodeCodec } = require('@matter/main/types');
const Promise = require('bluebird');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');
const logger = require('../../../utils/logger');

/**
 * @description Pair a device using a pairing code
 * @param {string} pairingCode - The pairing code to pair the device with
 * @example
 * await matterHandler.pairDevice('1234-567-9012');
 */
async function pairDevice(pairingCode) {
  // Decode pairing code
  const pairingCodeCodec = ManualPairingCodeCodec.decode(pairingCode);
  logger.debug(`Decoded pairing code: ${JSON.stringify(pairingCodeCodec)}`);

  // Commission the device
  const options = {
    commissioning: {
      regulatoryLocation: 0, // IndoorOutdoor
      regulatoryCountryCode: 'XX',
      regulatoryLocationType: 0, // Indoor
    },
    discovery: {
      identifierData: {
        shortDiscriminator: pairingCodeCodec.shortDiscriminator,
      },
      discoveryCapabilities: {
        ble: false,
      },
    },
    passcode: pairingCodeCodec.passcode,
    commissioningTimeoutSeconds: 60,
    commissioningAttempts: 3,
    commissioningRetryDelayMs: 1000,
  };

  logger.info(`Commissioning device with options: ${JSON.stringify(options)}`);
  try {
    const nodeId = await this.commissioningController.commissionNode(options);

    logger.info(`Successfully commissioned device with nodeId ${nodeId}`);

    const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
    await Promise.each(nodeDetails, async (nodeDetail) => {
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
        this.listenToStateChange(nodeDetail.nodeId, device);
        this.nodesMap.set(nodeDetail.nodeId, node);
        this.devices.push(gladysDevice);
      });
    });
  } catch (error) {
    logger.error(`Error commissioning device: ${error}`);
    throw error;
  }
}

module.exports = {
  pairDevice,
};
