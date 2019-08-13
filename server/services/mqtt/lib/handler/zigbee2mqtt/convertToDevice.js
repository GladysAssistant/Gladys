const { getFeatures } = require('./featuresByModel');

/**
 * @description Converts a zig2mqtt device to Gladys device.
 * @param {*} device - Zigbee2mqtt device.
 * @returns {*} Gladys device.
 * @example
 * convertToDevice({ ieeeAddr: 0x123, model: 'Aquara', friendly_name: 'MySensor' })
 */
const convertToDevice = (device) => {
  const gladysDevice = {
    name: device.friendly_name,
    external_id: device.ieeeAddr,
    params: [
      {
        name: 'model',
        params: device.model
      },
      {
        name: 'manufName',
        params: device.manufName
      },
      {
        name: 'modelId',
        params: device.modelId
      }
    ],
    features: getFeatures(device),
  };

  return gladysDevice;
};

module.exports = {
  convertToDevice,
}