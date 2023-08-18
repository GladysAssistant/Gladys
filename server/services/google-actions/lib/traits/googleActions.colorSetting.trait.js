const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { getDeviceFeature } = require('../../../../utils/device');
const { kelvinToMired, miredToKelvin } = require('../../../../utils/colors');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/colorsetting
 */
const colorSettingTrait = {
  key: 'action.devices.traits.ColorSetting',
  generateAttributes: (device) => {
    const result = {};

    const hasColor = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    if (hasColor) {
      result.colorModel = 'rgb';
    }

    const hasColorTemp = getDeviceFeature(
      device,
      DEVICE_FEATURE_CATEGORIES.LIGHT,
      DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    );
    if (hasColorTemp) {
      result.colorTemperatureRange = {
        temperatureMinK: Math.round(miredToKelvin(hasColorTemp.max)),
        temperatureMaxK: Math.round(miredToKelvin(hasColorTemp.min)),
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
        return Math.round(miredToKelvin(feature.last_value));
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
    'action.devices.commands.ColorAbsolute': (device, params) => {
      const events = [];
      const { color = {} } = params;
      const { temperature, spectrumRGB } = color;

      if (temperature !== undefined) {
        const relatedFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        );

        if (relatedFeature) {
          let newValue = Math.round(kelvinToMired(temperature));
          if (newValue > relatedFeature.max) {
            newValue = relatedFeature.max;
          }
          if (newValue < relatedFeature.min) {
            newValue = relatedFeature.min;
          }
          events.push({
            device_feature: relatedFeature.selector,
            value: newValue,
          });
        }
      }

      if (spectrumRGB !== undefined) {
        const relatedFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        );

        if (relatedFeature) {
          events.push({
            device_feature: relatedFeature.selector,
            value: spectrumRGB,
          });
        }
      }

      return { events };
    },
  },
};

module.exports = {
  colorSettingTrait,
};
