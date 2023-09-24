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
    'action.devices.commands.OnOff': (device, params) => {
      const events = [];

      const relatedFeature = device.features.find((feature) =>
        onOffTrait.features.find(({ category, type }) => feature.category === category && feature.type === type),
      );

      if (relatedFeature) {
        events.push({
          device_feature: relatedFeature.selector,
          value: params.on ? 1 : 0,
        });
      }

      return { events };
    },
  },
};

module.exports = {
  onOffTrait,
};
