const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/openclose
 */
const openCloseTrait = {
  key: 'action.devices.traits.OpenClose',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
      type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
    },
  ],
  generateAttributes: (device) => {
    const attributes = {
      discreteOnlyOpenClose: true,
      queryOnlyOpenClose: true,
    };

    const positionFeature = device.features.find(
      ({ category, type }) =>
        (category === DEVICE_FEATURE_CATEGORIES.CURTAIN && type === DEVICE_FEATURE_TYPES.CURTAIN.POSITION) ||
        (category === DEVICE_FEATURE_CATEGORIES.SHUTTER && type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION),
    );
    if (positionFeature) {
      const { read_only: readOnly } = positionFeature;

      attributes.discreteOnlyOpenClose = false;
      attributes.queryOnlyOpenClose = readOnly;
    }

    return attributes;
  },
  states: [
    {
      key: 'openPercent',
      readValue: (feature) => {
        return feature.last_value;
      },
    },
  ],
  commands: {
    'action.devices.commands.OpenClose': (device, params) => {
      const events = [];

      const positionFeature = device.features.find(
        ({ category, type }) =>
          (category === DEVICE_FEATURE_CATEGORIES.CURTAIN && type === DEVICE_FEATURE_TYPES.CURTAIN.POSITION) ||
          (category === DEVICE_FEATURE_CATEGORIES.SHUTTER && type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION),
      );

      if (positionFeature) {
        events.push({
          device_feature: positionFeature.selector,
          value: params.openPercent,
        });
      }

      return { events };
    },
  },
};

module.exports = {
  openCloseTrait,
};
