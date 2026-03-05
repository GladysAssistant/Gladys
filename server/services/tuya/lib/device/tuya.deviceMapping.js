const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  COVER_STATE,
  OPENING_SENSOR_STATE,
  AC_MODE,
  AC_FAN_SPEED,
  AC_SWING_HORIZONTAL,
  AC_SWING_VERTICAL,
  PILOT_WIRE_MODE,
} = require('../../../../utils/constants');

const { intToRgb, rgbToHsb, rgbToInt, hsbToRgb } = require('../../../../utils/colors');
const { normalizeBoolean } = require('../utils/tuya.normalize');

const OPEN = 'open';
const CLOSE = 'close';
const STOP = 'stop';

const TUYA_PILOT_WIRE_MODE_TO_GLADYS = {
  Standby: PILOT_WIRE_MODE.OFF,
  Anti_forst: PILOT_WIRE_MODE.FROST_PROTECTION,
  ECO: PILOT_WIRE_MODE.ECO,
  Comfort_1: PILOT_WIRE_MODE.COMFORT_1,
  Comfort_2: PILOT_WIRE_MODE.COMFORT_2,
  Comfort: PILOT_WIRE_MODE.COMFORT,
  Programming: PILOT_WIRE_MODE.PROGRAMMING,
  Thermostat: PILOT_WIRE_MODE.THERMOSTAT,
};

const GLADYS_PILOT_WIRE_MODE_TO_TUYA = Object.entries(TUYA_PILOT_WIRE_MODE_TO_GLADYS).reduce(
  (accumulator, [tuyaValue, gladysValue]) => {
    accumulator[gladysValue] = tuyaValue;
    return accumulator;
  },
  {},
);

const TUYA_AC_MODE_TO_GLADYS = {
  auto: AC_MODE.AUTO,
  cold: AC_MODE.COOLING,
  cool: AC_MODE.COOLING,
  heat: AC_MODE.HEATING,
  hot: AC_MODE.HEATING,
  wet: AC_MODE.DRYING,
  dry: AC_MODE.DRYING,
  fan: AC_MODE.FAN,
  wind: AC_MODE.FAN,
};

const GLADYS_AC_MODE_TO_TUYA = {
  [AC_MODE.AUTO]: 'auto',
  [AC_MODE.COOLING]: 'cold',
  [AC_MODE.HEATING]: 'heat',
  [AC_MODE.DRYING]: 'wet',
  [AC_MODE.FAN]: 'fan',
};

const TUYA_AC_FAN_SPEED_TO_GLADYS = {
  auto: AC_FAN_SPEED.AUTO,
  low: AC_FAN_SPEED.LOW,
  low_mid: AC_FAN_SPEED.LOW_MID,
  level_2: AC_FAN_SPEED.LOW_MID,
  mid: AC_FAN_SPEED.MID,
  middle: AC_FAN_SPEED.MID,
  mid_high: AC_FAN_SPEED.MID_HIGH,
  level_4: AC_FAN_SPEED.MID_HIGH,
  high: AC_FAN_SPEED.HIGH,
  mute: AC_FAN_SPEED.MUTE,
  turbo: AC_FAN_SPEED.TURBO,
  strong: AC_FAN_SPEED.TURBO,
};

const GLADYS_AC_FAN_SPEED_TO_TUYA = {
  [AC_FAN_SPEED.AUTO]: 'auto',
  [AC_FAN_SPEED.LOW]: 'low',
  [AC_FAN_SPEED.LOW_MID]: 'low_mid',
  [AC_FAN_SPEED.MID]: 'mid',
  [AC_FAN_SPEED.MID_HIGH]: 'mid_high',
  [AC_FAN_SPEED.HIGH]: 'high',
  [AC_FAN_SPEED.MUTE]: 'mute',
  [AC_FAN_SPEED.TURBO]: 'turbo',
};

const TUYA_AC_SWING_HORIZONTAL_TO_GLADYS = {
  off: AC_SWING_HORIZONTAL.OFF,
  same: AC_SWING_HORIZONTAL.SAME,
  opposite: AC_SWING_HORIZONTAL.OPPOSITE,
};

const GLADYS_AC_SWING_HORIZONTAL_TO_TUYA = {
  [AC_SWING_HORIZONTAL.OFF]: 'off',
  [AC_SWING_HORIZONTAL.SAME]: 'same',
  [AC_SWING_HORIZONTAL.OPPOSITE]: 'opposite',
};

const TUYA_AC_SWING_VERTICAL_TO_GLADYS = {
  off: AC_SWING_VERTICAL.OFF,
  '15': AC_SWING_VERTICAL.SWING,
  '1': AC_SWING_VERTICAL.POSITION_1,
  '2': AC_SWING_VERTICAL.POSITION_2,
  '3': AC_SWING_VERTICAL.POSITION_3,
  '4': AC_SWING_VERTICAL.POSITION_4,
  '5': AC_SWING_VERTICAL.POSITION_5,
};

const GLADYS_AC_SWING_VERTICAL_TO_TUYA = {
  [AC_SWING_VERTICAL.OFF]: 'off',
  [AC_SWING_VERTICAL.SWING]: '15',
  [AC_SWING_VERTICAL.POSITION_1]: '1',
  [AC_SWING_VERTICAL.POSITION_2]: '2',
  [AC_SWING_VERTICAL.POSITION_3]: '3',
  [AC_SWING_VERTICAL.POSITION_4]: '4',
  [AC_SWING_VERTICAL.POSITION_5]: '5',
};

const getScale = (deviceFeature, defaultScale = 0) => {
  const parsedScale =
    deviceFeature && deviceFeature.scale !== undefined && deviceFeature.scale !== null
      ? parseInt(deviceFeature.scale, 10)
      : defaultScale;

  return Number.isNaN(parsedScale) ? defaultScale : parsedScale;
};

const scaleValue = (valueFromDevice, deviceFeature, defaultScale = 0) => {
  const parsedValue = Number(valueFromDevice);
  if (Number.isNaN(parsedValue)) {
    return parsedValue;
  }
  const scale = getScale(deviceFeature, defaultScale);
  return parsedValue / 10 ** scale;
};

const unscaleValue = (valueFromGladys, deviceFeature, defaultScale = 0) => {
  const parsedValue = Number(valueFromGladys);
  if (Number.isNaN(parsedValue)) {
    return parsedValue;
  }
  const scale = getScale(deviceFeature, defaultScale);
  return Math.round(parsedValue * 10 ** scale);
};

const writeValues = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: (valueFromGladys) => {
      return parseInt(valueFromGladys, 10);
    },
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: (valueFromGladys) => {
      return 1000 - parseInt(valueFromGladys, 10);
    },
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: (valueFromGladys) => {
      const rgb = intToRgb(valueFromGladys);
      const hsb = rgbToHsb(rgb, 1000);
      return {
        h: hsb[0],
        s: hsb[1],
        v: hsb[2],
      };
    },
  },

  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
  },

  [DEVICE_FEATURE_CATEGORIES.CHILD_LOCK]: {
    [DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: (valueFromGladys) => {
      const parsedValue = parseInt(valueFromGladys, 10);
      return GLADYS_AC_MODE_TO_TUYA[parsedValue];
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: (valueFromGladys, deviceFeature) => {
      return unscaleValue(valueFromGladys, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: (valueFromGladys) => {
      const parsedValue = parseInt(valueFromGladys, 10);
      return GLADYS_AC_FAN_SPEED_TO_TUYA[parsedValue];
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL]: (valueFromGladys) => {
      const parsedValue = parseInt(valueFromGladys, 10);
      return GLADYS_AC_SWING_HORIZONTAL_TO_TUYA[parsedValue];
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL]: (valueFromGladys) => {
      const parsedValue = parseInt(valueFromGladys, 10);
      return GLADYS_AC_SWING_VERTICAL_TO_TUYA[parsedValue];
    },
  },
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromGladys, deviceFeature) => {
      return unscaleValue(valueFromGladys, deviceFeature, 0);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.HEATER]: {
    [DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE]: (valueFromGladys) => {
      const parsedValue = parseInt(valueFromGladys, 10);
      return GLADYS_PILOT_WIRE_MODE_TO_TUYA[parsedValue];
    },
  },

  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: (valueFromGladys) => {
      if (valueFromGladys === COVER_STATE.OPEN) {
        return OPEN;
      }
      if (valueFromGladys === COVER_STATE.CLOSE) {
        return CLOSE;
      }
      return STOP;
    },
    [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: (valueFromGladys) => {
      return parseInt(valueFromGladys, 10);
    },
  },
};

const readValues = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: (valueFromDevice) => {
      return normalizeBoolean(valueFromDevice) ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: (valueFromDevice) => {
      return valueFromDevice;
    },
    [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: (valueFromDevice) => {
      return 1000 - parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: (valueFromDevice) => {
      const parsedValue = JSON.parse(valueFromDevice);
      const hsb = [parsedValue.h, parsedValue.s, parsedValue.v];
      const rgb = hsbToRgb(hsb, 1000);
      return rgbToInt(rgb);
    },
  },

  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromDevice) => {
      return normalizeBoolean(valueFromDevice) ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 2);
    },
    [DEVICE_FEATURE_TYPES.SWITCH.CURRENT]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.SWITCH.POWER]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 1);
    },
    [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 1);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CHILD_LOCK]: {
    [DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY]: (valueFromDevice) => {
      return normalizeBoolean(valueFromDevice) ? 1 : 0;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY]: (valueFromDevice) => {
      return normalizeBoolean(valueFromDevice) ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: (valueFromDevice) => {
      return Object.prototype.hasOwnProperty.call(TUYA_AC_MODE_TO_GLADYS, valueFromDevice)
        ? TUYA_AC_MODE_TO_GLADYS[valueFromDevice]
        : null;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: (valueFromDevice) => {
      return Object.prototype.hasOwnProperty.call(TUYA_AC_FAN_SPEED_TO_GLADYS, valueFromDevice)
        ? TUYA_AC_FAN_SPEED_TO_GLADYS[valueFromDevice]
        : null;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL]: (valueFromDevice) => {
      return Object.prototype.hasOwnProperty.call(TUYA_AC_SWING_HORIZONTAL_TO_GLADYS, valueFromDevice)
        ? TUYA_AC_SWING_HORIZONTAL_TO_GLADYS[valueFromDevice]
        : null;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL]: (valueFromDevice) => {
      return Object.prototype.hasOwnProperty.call(TUYA_AC_SWING_VERTICAL_TO_GLADYS, valueFromDevice)
        ? TUYA_AC_SWING_VERTICAL_TO_GLADYS[valueFromDevice]
        : null;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX_TODAY]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
    [DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR]: {
    [DEVICE_FEATURE_TYPES.ENERGY_PRODUCTION_SENSOR.INDEX]: (valueFromDevice, deviceFeature) => {
      return scaleValue(valueFromDevice, deviceFeature, 0);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: (valueFromDevice) => {
      return normalizeBoolean(valueFromDevice) ? OPENING_SENSOR_STATE.OPEN : OPENING_SENSOR_STATE.CLOSE;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.HEATER]: {
    [DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE]: (valueFromDevice) => {
      return Object.prototype.hasOwnProperty.call(TUYA_PILOT_WIRE_MODE_TO_GLADYS, valueFromDevice)
        ? TUYA_PILOT_WIRE_MODE_TO_GLADYS[valueFromDevice]
        : null;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: (valueFromDevice) => {
      if (valueFromDevice === OPEN) {
        return COVER_STATE.OPEN;
      }
      if (valueFromDevice === CLOSE) {
        return COVER_STATE.CLOSE;
      }
      return COVER_STATE.STOP;
    },
    [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
};

module.exports = { readValues, writeValues };
