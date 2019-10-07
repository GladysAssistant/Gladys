const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const motionSensorCapability = {
  capability: {
    id: 'motionSensor',
    version: 1,
  },
  attributes: [
    {
      name: 'motion',
      properties: [
        {
          name: 'value',
          mapper: (feature) => (feature.last_value ? 'active' : 'inactive'),
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    },
  ],
};

module.exports = {
  motionSensorCapability,
};
