const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Get the temperature from a Device that reports current temperature.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Temperature-Measurement
 */
const temperatureMeasurementCapability = {
  capability: {
    id: 'st.temperatureMeasurement',
    version: 1,
  },
  attributes: [
    {
      name: 'temperature',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => feature.last_value,
        },
        {
          name: 'unit',
          writeValue: (feature) => (feature.unit === DEVICE_FEATURE_UNITS.CELSIUS ? 'C' : 'F'),
        },
      ],
    },
  ],
  commands: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
  ],
};

module.exports = {
  temperatureMeasurementCapability,
};
