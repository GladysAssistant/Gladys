const logger = require('../../../../../../utils/logger');

const { DEVICE_MODEL_GROUPS, DEVICE_MODEL_FEATURES } = require('./utils/awox.mesh.ble.constants');

/**
 * @description Transform Bluetooth device to AwoX BLEMesh.
 * @param {Object} device - Gladys device.
 * @param {Object} manufacturerData - Bluetooth manufacturer data.
 * @returns {Object} AwoX device.
 * @example
 * bleMesh.getDevice({ model: 'SML-W7' }, [ 0x60, 0x01 ]);
 */
function getDevice(device, manufacturerData) {
  logger.debug(`AwoX - BLEMesh: getting '${device.name}' AwoX device...`);

  const deviceGroup = Object.keys(DEVICE_MODEL_GROUPS).find((group) =>
    DEVICE_MODEL_GROUPS[group].includes(manufacturerData.model),
  );
  const features = DEVICE_MODEL_FEATURES[deviceGroup] || [];

  return {
    ...device,
    features,
  };
}

module.exports = {
  getDevice,
};
