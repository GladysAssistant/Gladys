const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { getGladysDeviceFeatures } = require('./air-to-air.device');

/**
 * @description Transform MELCloud device to Gladys device.
 * @param {object} melCloudDevice - MELCloud device.
 * @returns {object} Gladys device.
 * @example
 * convertDevice({ ... });
 */
function convertDevice(melCloudDevice) {
  const externalId = `melcloud:${melCloudDevice.DeviceID}`;

  const gladysDevice = {
    name: melCloudDevice.DeviceName,
    features: [],
    external_id: externalId,
    selector: externalId,
    model: melCloudDevice.Device.Units[0].Model,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS,
    should_poll: true,
    params: [
      {
        name: 'buildingID',
        value: melCloudDevice.BuildingID,
      },
    ],
  };

  switch (melCloudDevice.Device.DeviceType) {
    case 0: // Air-To-Air
      gladysDevice.features = getGladysDeviceFeatures(externalId, melCloudDevice);
      break;
    case 1: // Air-To-Water
      break;
    case 3: // Energy-Recovery-Ventilation
      break;
    default:
      // Unknown device type
      break;
  }

  return gladysDevice;
}

module.exports = {
  convertDevice,
};
