// eslint-disable-next-line import/no-unresolved
const { OnOff, OccupancySensing, IlluminanceMeasurement } = require('@matter/main/clusters');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/** 
 * {
  basicInformation: {
    dataModelRevision: 1,
    vendorName: 'Nanoleaf',
    vendorId: 4442,
    productName: 'NL67',
    productId: 67,
    nodeLabel: '',
    location: 'XX',
    hardwareVersion: 418,
    hardwareVersionString: '4.1.8',
    softwareVersion: 197120,
    softwareVersionString: '3.5.39',
    manufacturingDate: '20200101',
    partNumber: '',
    productUrl: '',
    productLabel: 'Essentials A19/A60',
    serialNumber: 'N24150B0B49',
    localConfigDisabled: false,
    reachable: true,
    uniqueId: '64F10E0A17A7F9E1',
    capabilityMinima: { caseSessionsPerFabric: 3, subscriptionsPerFabric: 3 }
  },
 */

/**
 * @description Convert a Matter device to a Gladys device.
 * @param {string} serviceId - The service ID.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {object} device - The device on the node.
 * @param {object} nodeDetailDeviceDataBasicInformation - The node detail device data basic information.
 * @param {string} devicePath - The path of the device.
 * @example
 * const gladysDevice = await convertToGladysDevice(serviceId, nodeId, node, device);
 * @returns {Promise<object>} The Gladys device.
 */
async function convertToGladysDevice(serviceId, nodeId, device, nodeDetailDeviceDataBasicInformation, devicePath) {
  const gladysDevice = {
    name: device.name,
    external_id: `matter:${nodeId}:${devicePath}`,
    selector: `matter:${nodeId}:${devicePath}`,
    service_id: serviceId,
    should_poll: false,
    features: [],
    params: [],
  };
  if (nodeDetailDeviceDataBasicInformation) {
    gladysDevice.name = `${
      nodeDetailDeviceDataBasicInformation.vendorName
    } (${nodeDetailDeviceDataBasicInformation.nodeLabel ||
      nodeDetailDeviceDataBasicInformation.productLabel ||
      nodeDetailDeviceDataBasicInformation.productName ||
      device.name})`;
  }
  if (device.clusterClients) {
    device.clusterClients.forEach((clusterClient, clusterIndex) => {
      logger.info(`Matter pairing - Cluster client ${clusterIndex}`);
      if (clusterIndex === OnOff.Complete.id) {
        gladysDevice.features.push({
          name: 'on_off',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === OccupancySensing.Complete.id) {
        gladysDevice.features.push({
          name: 'occupancy',
          category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === IlluminanceMeasurement.Complete.id) {
        gladysDevice.features.push({
          name: 'illuminance',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.LUX,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 1,
          max: 6553,
        });
      } else {
        logger.info(`Matter pairing - Cluster client ${clusterIndex} (${clusterClient.name}) not supported`);
      }
    });
  }
  return gladysDevice;
}

module.exports = {
  convertToGladysDevice,
};
