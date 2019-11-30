const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description The Alarm capability allows for interacting with devices that serve as alarms.
 *
 * @see https://smartthings.developer.samsung.com/docs/api-ref/capabilities.html#Alarm
 */
const alarmCapability = {
  capability: {
    id: 'st.alarm',
    version: 1,
  },
  attributes: [
    {
      name: 'alarm',
      properties: [
        {
          name: 'value',
          writeValue: (feature) => (feature.last_value ? 'siren' : 'off'),
        },
      ],
    },
  ],
  commands: {
    off: {
      readValue: () => 0,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
      },
    },
    siren: {
      readValue: () => 1,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
      },
    },
    strobe: {
      readValue: () => 1,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
      },
    },
    both: {
      readValue: () => 1,
      categories: {
        [DEVICE_FEATURE_CATEGORIES.SIREN]: [DEVICE_FEATURE_TYPES.SIREN.BINARY],
      },
    },
  },
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SIREN,
      type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
    },
  ],
};

module.exports = {
  alarmCapability,
};
