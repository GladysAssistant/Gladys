const {
  OnOff,
  OccupancySensing,
  IlluminanceMeasurement,
  TemperatureMeasurement,
  WindowCovering,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

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
    if (nodeDetailDeviceDataBasicInformation.uniqueId) {
      gladysDevice.params.push({
        name: 'UNIQUE_ID',
        value: nodeDetailDeviceDataBasicInformation.uniqueId,
      });
    }
  }

  // Add endpoint number to the name so the user can identify the device
  gladysDevice.name += ` ${device.number}`;

  if (device.clusterClients) {
    device.clusterClients.forEach((clusterClient, clusterIndex) => {
      logger.info(`Matter pairing - Cluster client ${clusterIndex}`);
      if (clusterIndex === OnOff.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId}`,
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
          name: `${clusterClient.name} - ${clusterClient.endpointId}`,
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
          name: `${clusterClient.name} - ${clusterClient.endpointId}`,
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
      } else if (clusterIndex === TemperatureMeasurement.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId}`,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: -100,
          max: 200,
        });
      } else if (clusterIndex === WindowCovering.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Position)`,
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
          read_only: false,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:position`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}:position`,
          min: 0,
          max: 100,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (State)`,
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
          read_only: false,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:state`,
          selector: `matter:${nodeId}:${devicePath}:${clusterIndex}:state`,
          min: 0,
          max: 1,
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
