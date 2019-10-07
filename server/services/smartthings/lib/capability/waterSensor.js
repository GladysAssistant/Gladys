const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const waterSensorCapability = {
  capability: {
    id: 'waterSensor',
    version: 1,
  },
  attributes: [
    {
      name: 'water',
      properties: [
        {
          name: 'value',
          mapper: (feature) => (feature.last_value ? 'wet' : 'dry'),
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    },
  ],
};

module.exports = {
  waterSensorCapability,
};
