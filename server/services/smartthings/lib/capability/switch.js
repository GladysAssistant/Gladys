const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const switchCapability = {
  capability: {
    id: 'switch',
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
      featureType: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
    off: {
      readValue: () => 0,
      featureType: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
  },
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SIREN,
      type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
    },
  ],
};

module.exports = {
  switchCapability,
};
