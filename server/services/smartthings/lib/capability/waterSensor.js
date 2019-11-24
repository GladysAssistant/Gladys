const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Get the status off of a water sensor device.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Water-Sensor
 */
const waterSensorCapability = {
  capability: {
    id: 'st.waterSensor',
    version: 1,
  },
  attributes: [
    {
      name: 'water',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => (feature.last_value ? 'wet' : 'dry'),
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
