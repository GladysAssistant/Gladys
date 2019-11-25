const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Allows for the control of a switch device.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Switch
 */
const switchCapability = {
  capability: {
    id: 'st.switch',
    version: 1,
  },
  attributes: [
    {
      name: 'switch',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => (feature.last_value ? 'on' : 'off'),
        },
      ],
    },
  ],
  commands: {
    on: {
      readValue: () => 1,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY],
        [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY],
      },
    },
    off: {
      readValue: () => 0,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SWITCH]: [DEVICE_FEATURE_TYPES.SWITCH.BINARY],
        [DEVICE_FEATURE_CATEGORIES.LIGHT]: [DEVICE_FEATURE_TYPES.LIGHT.BINARY],
      },
    },
  },
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
  ],
};

module.exports = {
  switchCapability,
};
