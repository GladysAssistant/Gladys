const deviceHandler = require('../handler_types');

/**
 * @description Determines the SmartThings device handler according to Gladys device features.
 * @param {Array} features - Device features.
 * @returns {string} Selected handler.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/device-handler-types.html#Reference
 *
 * @example
 * getDeviceHandlerType(device.features);
 */
function getDeviceHandlerType(features = []) {
  const featureCategoryTypes = [];

  let lastCategory;
  features.forEach((feature) => {
    const { category, type } = feature;
    if (!lastCategory) {
      lastCategory = category;
    } else {
      throw new Error(`SmartThings don't manage a device with multiple categories yet.`);
    }

    featureCategoryTypes.push(type);
  });

  let lastNbMatches = 0;
  let selectedHandler;
  Object.values(deviceHandler).forEach((handler) => {
    if (handler.category === lastCategory) {
      const nbMatches = handler.types.reduce((accumulator, handlerType) => {
        return accumulator + (featureCategoryTypes.includes(handlerType) ? 1 : 0);
      }, 0);

      if (nbMatches === handler.types.length && nbMatches > lastNbMatches) {
        selectedHandler = handler.value;
        lastNbMatches = nbMatches;
      }
    }
  });

  if (!selectedHandler) {
    throw new Error(`SmartThings don't manage this kind of device yet.`);
  }

  return selectedHandler;
}

module.exports = {
  getDeviceHandlerType,
};
