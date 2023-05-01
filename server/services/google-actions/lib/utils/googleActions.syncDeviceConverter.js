const { determineTypeAndTraits } = require('./googleActions.determineTypeAndTraits');

/**
 * @description Converts a Gladys device into a Google Actions device.
 * @param {object} gladysDevice - Gladys device.
 * @returns {object} GoogleActions device.
 * @example
 * syncDeviceConverter(device);
 */
function syncDeviceConverter(gladysDevice) {
  const { type, traits, attributes } = determineTypeAndTraits(gladysDevice);
  if (!type || !traits.length) {
    return null;
  }

  return {
    id: gladysDevice.selector,
    type,
    traits,
    name: {
      name: gladysDevice.name,
    },
    attributes,
    deviceInfo: {
      model: gladysDevice.model,
    },
    roomHint: gladysDevice.room ? gladysDevice.room.name : undefined,
    willReportState: true,
  };
}

module.exports = {
  syncDeviceConverter,
};
