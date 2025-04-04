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
 * @param {object} node - The Matter node.
 * @param {object} device - The device on the node.
 * @param {object} nodeDetailDeviceData - The node detail device data.
 * @example
 * const gladysDevice = await convertToGladysDevice(serviceId, nodeId, node, device);
 * @returns {Promise<object>} The Gladys device.
 */
async function convertToGladysDevice(serviceId, nodeId, node, device, nodeDetailDeviceData) {
  const gladysDevice = {
    name: device.name,
    external_id: `matter:${nodeId}:${device.number}`,
    selector: `matter:${nodeId}:${device.number}`,
    service_id: serviceId,
    should_poll: false,
    features: [],
    params: [],
  };
  if (nodeDetailDeviceData && nodeDetailDeviceData.basicInformation) {
    gladysDevice.name = `${nodeDetailDeviceData.basicInformation.vendorName} (${nodeDetailDeviceData.basicInformation
      .productLabel || device.name})`;
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
          external_id: `matter:${nodeId}:${device.number}:${clusterIndex}`,
          selector: `matter:${nodeId}:${device.number}:${clusterIndex}`,
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
          external_id: `matter:${nodeId}:${device.number}:${clusterIndex}`,
          selector: `matter:${nodeId}:${device.number}:${clusterIndex}`,
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
          external_id: `matter:${nodeId}:${device.number}:${clusterIndex}`,
          selector: `matter:${nodeId}:${device.number}:${clusterIndex}`,
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
