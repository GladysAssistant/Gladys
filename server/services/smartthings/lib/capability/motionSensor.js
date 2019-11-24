const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Allows for the ability to read motion sensor device states.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Motion-Sensor
 */
const motionSensorCapability = {
  capability: {
    id: 'st.motionSensor',
    version: 1,
  },
  attributes: [
    {
      name: 'motion',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => (feature.last_value ? 'active' : 'inactive'),
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
