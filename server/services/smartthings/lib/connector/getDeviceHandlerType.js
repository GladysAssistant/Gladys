const deviceHandler = require('../handler_types');

/**
 * @description Determines the SmartThings device handler according to Gladys device.
 * @param {Object} device - Gladys device.
 * @returns {Object} Selected handler.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/device-handler-types.html#Reference
 *
 * @example
 * getDeviceHandlerType(device.features);
 */
function getDeviceHandlerType(device) {
  const featureCategoryTypes = {};

  device.features.forEach((feature) => {
    const { category, type } = feature;

    if (!featureCategoryTypes[category]) {
      featureCategoryTypes[category] = [];
    }

    featureCategoryTypes[category].push(type);
  });

  let nbFeaturesMatches = 0;
  let selectedHandler;
  Object.values(deviceHandler).forEach((handler) => {
    let nbMatches = 0;
    let nbFeatures = -1;

    Object.keys(handler.categories).forEach((handlerCategory) => {
      nbFeatures += handler.categories[handlerCategory].length;

      if (featureCategoryTypes[handlerCategory]) {
        nbMatches += handler.categories[handlerCategory].reduce((accumulator, handlerType) => {
          return accumulator + (featureCategoryTypes[handlerCategory].includes(handlerType) ? 1 : 0);
        }, 0);
      }
    });

    if (nbMatches === nbFeatures && nbMatches > nbFeaturesMatches) {
      selectedHandler = handler;
      nbFeaturesMatches = nbMatches;
    }
  });

  if (!selectedHandler) {
    throw new Error(`SmartThings don't manage this kind of device yet : "${device.name}" ("${device.external_id}").`);
  }

  return selectedHandler;
}

module.exports = {
  getDeviceHandlerType,
};
