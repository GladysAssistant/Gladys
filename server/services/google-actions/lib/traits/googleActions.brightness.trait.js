const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/brightness
 */
const brightnessTrait = {
  key: 'action.devices.traits.Brightness',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    },
  ],
  states: [
    {
      key: 'brightness',
      readValue: (feature) => {
        return feature.last_value;
      },
    },
  ],
  commands: {
    'action.devices.commands.BrightnessAbsolute': (device, params) => {
      const events = [];
      const { brightness } = params;
      const relatedFeature = device.features.find((feature) =>
        brightnessTrait.features.find(({ category, type }) => feature.category === category && feature.type === type),
      );

      if (relatedFeature) {
        events.push({
          device_feature: relatedFeature.selector,
          value: brightness,
        });
      }

      return { events };
    },
  },
};

module.exports = {
  brightnessTrait,
};
