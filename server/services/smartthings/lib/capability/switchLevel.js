const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const switchLevelCapability = {
  capability: {
    id: 'switchLevel',
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
    setLevel: (args, feature) => Math.round((args.level * (feature.max - feature.min)) / 100 + feature.min),
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
