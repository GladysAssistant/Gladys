const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const illuminanceMeasurementCapability = {
  capability: {
    id: 'illuminanceMeasurement',
    version: 1,
  },
  attributes: [
    {
      name: 'illuminance',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => feature.last_value,
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
  ],
};

module.exports = {
  illuminanceMeasurementCapability,
};
