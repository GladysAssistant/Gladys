// eslint-disable-next-line import/no-unresolved
const { ManualPairingCodeCodec } = require('@matter/main/types');

const logger = require('../../../utils/logger');

/**
 * @description Pair a device using a pairing code.
 * @param {string} pairingCode - The pairing code to pair the device with.
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
    commissioningTimeoutSeconds: 90,
    commissioningAttempts: 4,
    commissioningRetryDelayMs: 1000,
  };

  logger.info(`Commissioning device with options: ${JSON.stringify(options)}`);
  try {
    const nodeId = await this.commissioningController.commissionNode(options);

    logger.info(`Successfully commissioned device with nodeId ${nodeId}`);

    // Get the node details
    const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
    const nodeDetail = nodeDetails.find((nd) => nd.nodeId === nodeId);
    // Convert the node & listen to state changes
    await this.handleNode(nodeDetail);
  } catch (error) {
    logger.error(`Error commissioning device: ${error}`);
    throw error;
  }
}

module.exports = {
  pairDevice,
};
