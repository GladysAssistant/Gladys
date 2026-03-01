const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES, COVER_STATE } = require('../../../../utils/constants');

const { intToRgb, rgbToHsb, rgbToInt, hsbToRgb } = require('../../../../utils/colors');
const { normalizeBoolean } = require('../utils/tuya.normalize');

const OPEN = 'open';
const CLOSE = 'close';
const STOP = 'stop';

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
