const { OnOff } = require('@matter/main/clusters');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Set the value of a feature on a device.
 * @param {object} gladysDevice - The Gladys device.
 * @param {object} gladysFeature - The Gladys feature.
 * @param {number} value - The value to set.
 * @example
 * const value = await setValue(gladysDevice, gladysFeature, value);
 */
async function setValue(gladysDevice, gladysFeature, value) {
  // Convert external_id to nodeId
  const nodeId = BigInt(gladysDevice.external_id.split(':')[1]);
  const deviceNumber = Number(gladysDevice.external_id.split(':')[2]);
  logger.info(`Setting value for node ${nodeId}`);
  const node = this.nodesMap.get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }
  const devices = node.getDevices();
  // Handle binary device
  if (gladysFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
    const device = devices.find((d) => d.number === deviceNumber);
    const onOff = device.clusterClients.get(OnOff.Complete.id);

    if (!onOff) {
      throw new Error('Device does not support OnOff cluster');
    }

    // Connect if not already connected
    if (!node.isConnected) {
      node.connect();
      await node.events.initialized;
    }

    // Control the device
    if (value === 1) {
      await onOff.on();
    } else {
      await onOff.off();
    }
  }
}

module.exports = { setValue };
