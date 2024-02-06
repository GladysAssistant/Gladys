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
    /* plug_connected_boiler: 1 */
    /* boiler_status: true */
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === true || valueFromDevice === 1 ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: {
    /* battery_percent: 76 */
    [DEVICE_FEATURE_TYPES.BATTERY.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
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
    /* rf_strength: 76 */
    /* wifi_strength: 76 */
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
};

module.exports = { readValues, writeValues };
