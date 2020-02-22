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

  let nbDeviceFeatures = 0;
  device.features.forEach((feature) => {
    const { category, type } = feature;

    if (!featureCategoryTypes[category]) {
      featureCategoryTypes[category] = [];
    }

    featureCategoryTypes[category].push(type);
    nbDeviceFeatures += 1;
  });

  let nbFeaturesMatches = 0;
  let nbFeatureSelectedHandler = 0;
  let selectedHandler;
  let exactMatch = false;
  let i = 0;

  const deviceHandlers = Object.values(deviceHandler);

  while (deviceHandlers[i] && !exactMatch) {
    const handler = deviceHandlers[i];
    let nbMatches = 0;
    let nbFeatures = 0;

    Object.keys(handler.categories).forEach((handlerCategory) => {
      nbFeatures += handler.categories[handlerCategory].length;

      if (featureCategoryTypes[handlerCategory]) {
        nbMatches += handler.categories[handlerCategory].reduce((accumulator, handlerType) => {
          return accumulator + (featureCategoryTypes[handlerCategory].includes(handlerType) ? 1 : 0);
        }, 0);
      }
    });

    if (
      nbMatches > 0 &&
      (!selectedHandler ||
        nbMatches > nbFeaturesMatches ||
        (nbMatches === nbFeaturesMatches && nbFeatureSelectedHandler > nbFeatures))
    ) {
      nbFeatureSelectedHandler = nbFeatures;
      selectedHandler = handler;
      nbFeaturesMatches = nbMatches;

      exactMatch = nbFeatures === nbDeviceFeatures && nbFeaturesMatches === nbDeviceFeatures;
    }

    i += 1;
  }

  if (!selectedHandler) {
    throw new Error(`SmartThings don't manage this kind of device yet : "${device.name}" ("${device.external_id}").`);
  }

  return selectedHandler;
}

module.exports = {
  getDeviceHandlerType,
};
