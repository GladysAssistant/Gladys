const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Defines that the device has a battery.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Battery
 */
const batteryCapability = {
  capability: {
    id: 'st.battery',
    version: 1,
  },
  attributes: [
    {
      name: 'battery',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => Math.round(feature.last_value),
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
