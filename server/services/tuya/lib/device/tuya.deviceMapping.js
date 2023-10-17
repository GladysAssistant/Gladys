const {
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
} = require('../../../../utils/constants');

const { intToRgb, rgbToHsb, rgbToInt, hsbToRgb } = require('../../../../utils/colors');

const SWITCH_LED = 'switch_led';
const BRIGHT_VALUE_V2 = 'bright_value_v2';
const TEMP_VALUE_V2 = 'temp_value_v2';
const COLOUR_DATA_V2 = 'colour_data_v2';

const COLOUR_DATA = 'colour_data';

const ADD_ELE = 'add_ele';
const CUR_CURRENT = 'cur_current';
const CUR_POWER = 'cur_power';
const CUR_VOLTAGE = 'cur_voltage';

const SWITCH_1 = 'switch_1';
const SWITCH_2 = 'switch_2';
const SWITCH_3 = 'switch_3';
const SWITCH_4 = 'switch_4';

const CONTROL = 'control';
const PERCENT_CONTROL = 'percent_control';

const OPEN = 'open';
const CLOSE = 'close';
const STOP = 'stop';

const mappings = {
  [SWITCH_LED]: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
  },
  [BRIGHT_VALUE_V2]: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  },
  [TEMP_VALUE_V2]: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
  },
  [COLOUR_DATA_V2]: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  },
  [COLOUR_DATA]: {
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  },

  [SWITCH_1]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [SWITCH_2]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [SWITCH_3]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [SWITCH_4]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [CONTROL]: {
    category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
    type: DEVICE_FEATURE_TYPES.CURTAIN.STATE,
  },
  [PERCENT_CONTROL]: {
    category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
    type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
  },
  [ADD_ELE]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  [CUR_CURRENT]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
    unit: DEVICE_FEATURE_UNITS.MILLI_AMPERE,
  },
  [CUR_POWER]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
    unit: DEVICE_FEATURE_UNITS.WATT,
  },
  [CUR_VOLTAGE]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
    unit: DEVICE_FEATURE_UNITS.VOLT,
  },
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

module.exports = { mappings, readValues, writeValues };
