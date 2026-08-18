const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isNumeric } = require('../../../../utils/device');

/**
 * @see https://developers.google.com/assistant/smarthome/traits/humiditysetting
 */
const humiditySettingTrait = {
  key: 'action.devices.traits.HumiditySetting',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
  ],
  generateAttributes: () => {
    return {
      // Gladys only exposes humidity sensors here, they never receive a setpoint.
      queryOnlyHumiditySetting: true,
    };
  },
  states: [
    {
      key: 'humidityAmbientPercent',
      readValue: (feature) => {
        const { last_value: lastValue } = feature;

        if (!isNumeric(lastValue)) {
          return null;
        }

        // Google Home only accepts an integer percentage.
        return Math.round(lastValue);
      },
    },
  ],
  commands: {},
};

module.exports = {
  humiditySettingTrait,
};
