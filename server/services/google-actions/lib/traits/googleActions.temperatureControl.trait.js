const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { isNumeric } = require('../../../../utils/device');
const { fahrenheitToCelsius } = require('../../../../utils/units');

const KELVIN_TO_CELSIUS_OFFSET = 273.15;

// temperatureRange is required by the trait, so a feature without min/max still needs one:
// this fallback is wide enough for any indoor or outdoor sensor.
const DEFAULT_MIN_THRESHOLD_CELSIUS = -100;
const DEFAULT_MAX_THRESHOLD_CELSIUS = 100;

/**
 * @description Converts a temperature to Celsius, Google Home only works with Celsius values,
 * whatever the unit configured in Gladys.
 * @param {number} value - Temperature in the Gladys feature unit.
 * @param {string} unit - Gladys feature unit.
 * @returns {number} The temperature in Celsius.
 * @example
 * toCelsius(68, 'fahrenheit');
 */
const toCelsius = (value, unit) => {
  if (unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    return fahrenheitToCelsius(value);
  }
  if (unit === DEVICE_FEATURE_UNITS.KELVIN) {
    return value - KELVIN_TO_CELSIUS_OFFSET;
  }
  return value;
};

/**
 * @description Rounds a temperature to one decimal, Google Home displays temperatures with
 * one decimal and it avoids sending the floating point noise of the unit conversions.
 * @param {number} value - Temperature in Celsius.
 * @returns {number} The rounded temperature.
 * @example
 * roundTemperature(21.1111);
 */
const roundTemperature = (value) => Math.round(value * 10) / 10;

/**
 * @see https://developers.google.com/assistant/smarthome/traits/temperaturecontrol
 */
const temperatureControlTrait = {
  key: 'action.devices.traits.TemperatureControl',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
    {
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    },
  ],
  generateAttributes: (device) => {
    const temperatureFeature = device.features.find(({ category, type }) =>
      temperatureControlTrait.features.some(
        (traitFeature) => traitFeature.category === category && traitFeature.type === type,
      ),
    );

    const { unit, min, max } = temperatureFeature;

    const attributes = {
      // Gladys only exposes temperature sensors here, they never receive a setpoint.
      queryOnlyTemperatureControl: true,
      temperatureUnitForUX: unit === DEVICE_FEATURE_UNITS.FAHRENHEIT ? 'F' : 'C',
    };

    attributes.temperatureRange =
      isNumeric(min) && isNumeric(max)
        ? {
            minThresholdCelsius: roundTemperature(toCelsius(min, unit)),
            maxThresholdCelsius: roundTemperature(toCelsius(max, unit)),
          }
        : {
            minThresholdCelsius: DEFAULT_MIN_THRESHOLD_CELSIUS,
            maxThresholdCelsius: DEFAULT_MAX_THRESHOLD_CELSIUS,
          };

    return attributes;
  },
  states: [
    {
      key: 'temperatureAmbientCelsius',
      readValue: (feature) => {
        const { last_value: lastValue, unit } = feature;

        if (!isNumeric(lastValue)) {
          // The state is typed as a number by Google: an unknown value is omitted from the
          // payload (JSON.stringify drops undefined keys) rather than sent as null.
          return undefined;
        }

        return roundTemperature(toCelsius(lastValue, unit));
      },
    },
  ],
  commands: {},
};

module.exports = {
  temperatureControlTrait,
};
