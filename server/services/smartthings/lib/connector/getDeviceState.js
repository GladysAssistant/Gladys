// const deviceHandler = require('../handler_types');

/**
 * @description Determines the SmartThings device handler according to Gladys device features.
 * @param {Array} features - Device features.
 * @returns {Object} Selected handler.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/device-handler-types.html#Reference
 *
 * @example
 * getDeviceState(device.features);
 */
function getDeviceState(features) {
  // return features.map((feature) => {
  return [
    {
      component: 'main',
      capability: 'st.healthCheck',
      attribute: 'healthStatus',
      value: 'online',
    },
    {
      component: 'main',
      capability: 'st.imageCapture',
      attribute: 'image',
      value: 'https://home.trovato.fr:9999/api/v1/camera/livingroom/image',
    },
  ];
  // });
}

module.exports = {
  getDeviceState,
};
