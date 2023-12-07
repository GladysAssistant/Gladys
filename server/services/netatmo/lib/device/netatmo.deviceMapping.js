const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const writeValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    /* therm_setpoint_temperature: 14 */
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
    /* mode: therm_setpoint_mode = "program", "away", "hg", "manual", "off", "max", "schedule" */
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TEXT]: (valueFromGladys) => {
      let valueToDevice;
      if (valueFromGladys === 0) {
        valueToDevice = 'off';
      }
      if (valueFromGladys === 1) {
        valueToDevice = 'program';
      }
      if (valueFromGladys === 2) {
        valueToDevice = 'away';
      }
      if (valueFromGladys === 3) {
        valueToDevice = 'hg';
      }
      if (valueFromGladys === 4) {
        valueToDevice = 'manual';
      }
      if (valueFromGladys === 5) {
        valueToDevice = 'max';
      }
      if (valueFromGladys === 6) {
        valueToDevice = 'schedule';
      }
      return valueToDevice;
    },
  },
};

const readValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
    /* therm_setpoint_mode: "program", "away", "hg", "manual", "off", "max", "schedule" */
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TEXT]: (valueFromDevice) => {
      let valueToGladys;
      if (valueFromDevice === 'off') {
        valueToGladys = 0;
      }
      if (valueFromDevice === 'program') {
        valueToGladys = 1;
      }
      if (valueFromDevice === 'away') {
        valueToGladys = 2;
      }
      if (valueFromDevice === 'hg') {
        valueToGladys = 3;
      }
      if (valueFromDevice === 'manual') {
        valueToGladys = 4;
      }
      if (valueFromDevice === 'max') {
        valueToGladys = 5;
      }
      if (valueFromDevice === 'schedule') {
        valueToGladys = 6;
      }
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    /* reachable: true or room.reachable: true */
    /* plug_connected_boiler: 1 */
    /* boiler_status: true */
    /* boiler_valve_comfort_boost: false */
    /* anticipating: false or room.anticipating : false */
    /* therm_relay_cmd: 1 */
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === (true || 1) ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.ORIENTATION_SENSOR]: {
    /* therm_orientation: 1 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
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
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT_REQUEST_SENSOR]: {
    /* heating_power_request: 76 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
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
  [DEVICE_FEATURE_CATEGORIES.SCHEDULE]: {
    /* room.therm_setpoint_start_time: 1701382473 */
    /* room.therm_setpoint_end_time: 1701382473 */
    /* last_therm_seen: 1701493502 */
    [DEVICE_FEATURE_TYPES.SCHEDULE.TIME_HOUR]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice * 1000;
      return valueToGladys;
    },
    [DEVICE_FEATURE_TYPES.SCHEDULE.TIME_DAY_HOUR]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice * 1000;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    /* room.open_window: false */
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === (true || 1) ? 1 : 0;
      return valueToGladys;
    },
  },
};

module.exports = { readValues, writeValues };
