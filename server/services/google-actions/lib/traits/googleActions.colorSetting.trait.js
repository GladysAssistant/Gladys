const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/colorsetting
 */
const colorSettingTrait = {
  key: 'action.devices.traits.ColorSetting',
  generateAttributes: (device) => {
    const result = {};

    const hasColor = device.features.find(
      (f) => f.category === DEVICE_FEATURE_CATEGORIES.LIGHT && f.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    );
    if (hasColor) {
      result.colorModel = 'rgb';
    }

    const hasColorTemp = device.features.find(
      (f) => f.category === DEVICE_FEATURE_CATEGORIES.LIGHT && f.type === DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    );
    if (hasColorTemp) {
      result.colorTemperatureRange = {
        temperatureMinK: 2000,
        temperatureMaxK: 9000,
      };
    }

    return result;
  },
  attributes: {},
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    },
  ],
  states: [
    {
      key: 'color.spectrumRgb',
      readValue: (feature) => {
        return feature.last_value;
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        },
      ],
    },
    {
      key: 'color.temperatureK',
      readValue: (feature) => {
        return feature.last_value * 70 + 2000;
      },
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        },
      ],
    },
  ],
  commands: {
    'action.devices.commands.ColorAbsolute': {
      'color.temperature': {
        writeValue: (paramValue) => {
          return (paramValue - 2000) / 70;
        },
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
          },
        ],
      },
      'color.spectrumRGB': {
        writeValue: (paramValue) => {
          return paramValue;
        },
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
          },
        ],
      },
    },
  },
};

module.exports = {
  colorSettingTrait,
};
