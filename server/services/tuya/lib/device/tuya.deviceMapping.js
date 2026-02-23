const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  COVER_STATE,
  AC_MODE,
  AC_FAN_SPEED,
} = require('../../../../utils/constants');

const { intToRgb, rgbToHsb, rgbToInt, hsbToRgb } = require('../../../../utils/colors');

const OPEN = 'open';
const CLOSE = 'close';
const STOP = 'stop';

const TUYA_MODE_TO_GLADYS = {
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

const GLADYS_MODE_TO_TUYA = {
  [AC_MODE.AUTO]: 'auto',
  [AC_MODE.COOLING]: 'cold',
  [AC_MODE.HEATING]: 'heat',
  [AC_MODE.DRYING]: 'wet',
  [AC_MODE.FAN]: 'fan',
};

const GLADYS_MODE_STRING_TO_TUYA = {
  auto: 'auto',
  cooling: 'cold',
  heating: 'heat',
  drying: 'wet',
  fan: 'fan',
};

const TUYA_FAN_SPEED_TO_GLADYS = {
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

const GLADYS_FAN_SPEED_TO_TUYA = {
  [AC_FAN_SPEED.AUTO]: 'auto',
  [AC_FAN_SPEED.LOW]: 'low',
  [AC_FAN_SPEED.LOW_MID]: 'low_mid',
  [AC_FAN_SPEED.MID]: 'mid',
  [AC_FAN_SPEED.MID_HIGH]: 'mid_high',
  [AC_FAN_SPEED.HIGH]: 'high',
  [AC_FAN_SPEED.MUTE]: 'mute',
  [AC_FAN_SPEED.TURBO]: 'turbo',
};

const getScale = (deviceFeature) => {
  const scale = deviceFeature && deviceFeature.scale !== undefined ? Number(deviceFeature.scale) : 0;
  return Number.isFinite(scale) ? scale : 0;
};

const scaleFromDevice = (valueFromDevice, deviceFeature) => {
  if (valueFromDevice === null || valueFromDevice === undefined) {
    return null;
  }
  const numericValue = Number(valueFromDevice);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const scale = getScale(deviceFeature);
  if (scale === 0) {
    if (
      deviceFeature &&
      Number.isFinite(deviceFeature.max) &&
      deviceFeature.max <= 100 &&
      numericValue > deviceFeature.max
    ) {
      return numericValue / 10;
    }
    return numericValue;
  }
  return numericValue / 10 ** scale;
};

const scaleToDevice = (valueFromGladys, deviceFeature) => {
  if (valueFromGladys === null || valueFromGladys === undefined) {
    return null;
  }
  const numericValue = Number(valueFromGladys);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const scale = getScale(deviceFeature);
  if (scale === 0) {
    if (deviceFeature && Number.isFinite(deviceFeature.max) && deviceFeature.max <= 100) {
      return Math.round(numericValue * 10);
    }
    return numericValue;
  }
  return Math.round(numericValue * 10 ** scale);
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

  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: (valueFromGladys) => {
      if (typeof valueFromGladys === 'string') {
        const normalized = valueFromGladys.toLowerCase();
        const numeric = Number(normalized);
        if (!Number.isNaN(numeric)) {
          return GLADYS_MODE_TO_TUYA[numeric] || GLADYS_MODE_STRING_TO_TUYA[normalized] || normalized;
        }
        return GLADYS_MODE_STRING_TO_TUYA[normalized] || normalized;
      }
      return GLADYS_MODE_TO_TUYA[valueFromGladys] || valueFromGladys;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: (valueFromGladys, deviceFeature) => {
      return scaleToDevice(valueFromGladys, deviceFeature);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: (valueFromGladys) => {
      if (typeof valueFromGladys === 'string') {
        const normalized = valueFromGladys.toLowerCase();
        const numeric = Number(normalized);
        if (!Number.isNaN(numeric)) {
          return GLADYS_FAN_SPEED_TO_TUYA[numeric] || normalized;
        }
        return normalized;
      }
      return GLADYS_FAN_SPEED_TO_TUYA[valueFromGladys] || valueFromGladys;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.ECO]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.DRYING]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.CLEANING]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.AUX_HEAT]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.LIGHT]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SLEEP]: (valueFromGladys) => {
      return valueFromGladys === 1;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.HEALTH]: (valueFromGladys) => {
      return valueFromGladys === 1;
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
      return valueFromDevice === true ? 1 : 0;
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
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.SWITCH.ENERGY]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10) / 100;
    },
    [DEVICE_FEATURE_TYPES.SWITCH.CURRENT]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.SWITCH.POWER]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10) / 10;
    },
    [DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10) / 10;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: (valueFromDevice) => {
      if (typeof valueFromDevice !== 'string') {
        return valueFromDevice;
      }
      const normalized = valueFromDevice.toLowerCase();
      return TUYA_MODE_TO_GLADYS[normalized] !== undefined ? TUYA_MODE_TO_GLADYS[normalized] : valueFromDevice;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: (valueFromDevice, deviceFeature) => {
      return scaleFromDevice(valueFromDevice, deviceFeature);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: (valueFromDevice) => {
      if (typeof valueFromDevice !== 'string') {
        return valueFromDevice;
      }
      const normalized = valueFromDevice.toLowerCase();
      return TUYA_FAN_SPEED_TO_GLADYS[normalized] !== undefined
        ? TUYA_FAN_SPEED_TO_GLADYS[normalized]
        : valueFromDevice;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.ECO]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.DRYING]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.CLEANING]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.AUX_HEAT]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.LIGHT]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SLEEP]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.HEALTH]: (valueFromDevice) => {
      return valueFromDevice === true ? 1 : 0;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice, deviceFeature) => {
      return scaleFromDevice(valueFromDevice, deviceFeature);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.DURATION]: {
    [DEVICE_FEATURE_TYPES.DURATION.INTEGER]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.DURATION.DECIMAL]: (valueFromDevice) => {
      return parseFloat(valueFromDevice);
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
