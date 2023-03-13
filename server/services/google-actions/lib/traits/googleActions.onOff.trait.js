const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/onoff
 */
const onOffTrait = {
  key: 'action.devices.traits.OnOff',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    },
  ],
  states: [
    {
      key: 'on',
      readValue: (feature) => {
        return feature.last_value === 1;
      },
    },
  ],
  commands: {
    'action.devices.commands.OnOff': {
      on: {
        writeValue: (paramValue) => {
          return paramValue ? 1 : 0;
        },
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          },
          {
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          },
        ],
      },
    },
  },
};

module.exports = {
  onOffTrait,
};
