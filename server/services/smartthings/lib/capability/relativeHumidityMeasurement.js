const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const relativeHumidityMeasurementCapability = {
  capability: {
    id: 'relativeHumidityMeasurement',
    version: 1,
  },
  attributes: [
    {
      name: 'humidity',
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
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
  ],
};

module.exports = {
  relativeHumidityMeasurementCapability,
};
