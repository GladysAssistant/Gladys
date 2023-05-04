const set = require('set-value');
const { determineTrait } = require('./googleActions.determineTrait');

/**
 * @description Converts a Gladys device into a Google Actions device.
 * @param {object} gladysDevice - Gladys device.
 * @returns {object} GoogleActions device.
 * @example
 * queryDeviceConverter(device);
 */
function queryDeviceConverter(gladysDevice) {
  const device = {
    online: true,
  };

  gladysDevice.features.forEach((feature) => {
    const trait = determineTrait(feature);

    if (trait) {
      trait.states
        .filter(
          (state) =>
            !state.features || state.features.find((f) => f.category === feature.category && f.type === feature.type),
        )
        .forEach((state) => {
          set(device, state.key, state.readValue(feature));
        });
    }
  });

  return device;
}

module.exports = {
  queryDeviceConverter,
};
