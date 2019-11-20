const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const batteryCapability = {
  capability: {
    id: 'battery',
    version: 1,
  },
  attributes: [
    {
      name: 'battery',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => Math.round(((feature.last_value - feature.min) / (feature.max - feature.min)) * 100),
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.BATTERY,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.BATTERY,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
  ],
};

module.exports = {
  batteryCapability,
};
