const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Allows for the control of the level of a device like a light or a dimmer switch.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Switch-Level
 */
const switchLevelCapability = {
  capability: {
    id: 'st.switchLevel',
    version: 1,
  },
  attributes: [
    {
      name: 'level',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => Math.round(((feature.last_value - feature.min) / (feature.max - feature.min)) * 100),
        },
      ],
    },
  ],
  commands: {
    setLevel: {
      readValue: (args, feature) => Math.round((args.level * (feature.max - feature.min)) / 100 + feature.min),
      featureType: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    },
  },
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    },
  ],
};

module.exports = {
  switchLevelCapability,
};
