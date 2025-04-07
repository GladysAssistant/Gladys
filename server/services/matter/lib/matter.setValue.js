const { OnOff } = require('@matter/main/clusters');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Find a device recursively through child endpoints.
 * @param {object} parentDevice - The parent device to search in.
 * @param {string[]} path - Array of device numbers to follow.
 * @returns {object|null} - The found device or null.
 * @example
 * const targetDevice = findDeviceRecursively(rootDevice, devicePath.slice(1));
 */
function findDeviceRecursively(parentDevice, path) {
  if (path.length === 0) {
    return parentDevice;
  }

  const [currentNumber, ...remainingPath] = path;

  // If this is a child_endpoint marker, skip to next number
  if (currentNumber === 'child_endpoint') {
    return findDeviceRecursively(parentDevice, remainingPath);
  }

  const deviceNumber = Number(currentNumber);

  // Look in child endpoints
  if (parentDevice.childEndpoints) {
    const childDevice = parentDevice.childEndpoints.find((child) => child.number === deviceNumber);
    if (childDevice) {
      return findDeviceRecursively(childDevice, remainingPath);
    }
  }

  return null;
}

/**
 * @description Set the value of a feature on a device.
 * @param {object} gladysDevice - The Gladys device.
 * @param {object} gladysFeature - The Gladys feature.
 * @param {number} value - The value to set.
 * @example
 * const value = await setValue(gladysDevice, gladysFeature, value);
 */
async function setValue(gladysDevice, gladysFeature, value) {
  // Parse the external_id
  const parts = gladysDevice.external_id.split(':');
  const nodeId = BigInt(parts[1]);

  logger.info(`Setting value for node ${nodeId}`);
  const node = this.nodesMap.get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const devices = node.getDevices();
  if (devices.length === 0) {
    throw new Error(`No devices found for node ${nodeId}`);
  }

  // Remove 'matter' and nodeId from parts to get the device path
  const devicePath = parts.slice(2);
  const rootDevice = devices.find((d) => d.number === Number(devicePath[0]));
  if (!rootDevice) {
    throw new Error(`Root device ${devicePath[0]} not found`);
  }

  // Find the target device through the hierarchy
  const targetDevice = findDeviceRecursively(rootDevice, devicePath.slice(1));
  if (!targetDevice) {
    throw new Error(`Device not found for path ${devicePath.join(':')}`);
  }

  // Handle binary device
  if (gladysFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
    const onOff = targetDevice.clusterClients.get(OnOff.Complete.id);

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
