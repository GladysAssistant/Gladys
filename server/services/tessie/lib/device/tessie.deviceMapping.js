const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const writeValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    /* therm_setpoint_temperature: 14 */
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
};

const readValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    /* plug_connected_boiler: 1 or boiler_status: true */
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === true || valueFromDevice === 1 ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: {
    /* battery_percent: 76 or battery_state: 'medium' */
    [DEVICE_FEATURE_TYPES.BATTERY.INTEGER]: (valueFromDevice) => {
      const batteryLevels = {
        max: 100,
        full: 90,
        high: 75,
        medium: 50,
        low: 25,
        'very low': 10,
      };

      const valueToGladys =
        batteryLevels[valueFromDevice] !== undefined ? batteryLevels[valueFromDevice] : parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    /* temperature: 20.5 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: {
    /* rf_strength: 76 or wifi_strength: 76 */
    [DEVICE_FEATURE_TYPES.SIGNAL.QUALITY]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    /* room.open_window: false */
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === true || valueFromDevice === 1 ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: {
    /* co2: 550 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    /* humidity: 26 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR]: {
    /* noise: 32 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: {
    /* pressure: 1050 or absolute_pressure: 1018 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: {
    /* wind_strength: 5 */
    [DEVICE_FEATURE_TYPES.SPEED_SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR]: {
    /* wind_angle: 120 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR]: {
    /* rain: 1.5 or sum_rain_1: 5.1 or sum_rain_24: 10.1 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
};

module.exports = { readValues, writeValues };
