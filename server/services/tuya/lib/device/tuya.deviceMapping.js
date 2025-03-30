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

const CHARGE_ENERGY = 'charge_energy';
const BALANCE_ENERGY = 'balance_energy';
const CLEAR_ENERGY = 'clear_energy';
const FORWARD_ENERGY_TOTAL = 'forward_energy_total';
const SWITCH_PREPAYMENT = 'switch_prepayment';
const PHASE_A = 'phase_a';
const EVENT_CLEAR = 'event_clear';
const SWITCH_EVENT = 'switch';

const AIR_CONDITIONING_POWER = 'power';
const AIR_CONDITIONING_MODE = 'mode';
const AIR_CONDITIONING_TEMPERATURE = 'temp';
const AIR_CONDITIONING_FAN_SPEED = 'wind';

const TV_POWER = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Power";
const TV_CHANNEL_UP = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "ChannelUp";
const TV_CHANNEL_DOWN = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "ChannelDown";
const TV_VOLUME_UP = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "VolumeUp";
const TV_VOLUME_DOWN = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "VolumeDown";
const TV_MUTE = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Mute";
const TV_MENU = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Menu";
const TV_BACK = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Back";
const TV_UP = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Up";
const TV_DOWN = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Down";
const TV_LEFT = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Left";
const TV_RIGHT = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Right";
const TV_EXIT = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Exit";
const TV_HOME = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "Home";
const TV_OK = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "OK";
const TV_1 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "1";
const TV_2 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "2";
const TV_3 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "3";
const TV_4 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "4";
const TV_5 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "5";
const TV_6 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "6";
const TV_7 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "7";
const TV_8 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "8";
const TV_9 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "9";
const TV_0 = DEVICE_FEATURE_CATEGORIES.TELEVISION + "_" + "0";


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
  [CHARGE_ENERGY]: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  [BALANCE_ENERGY]: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  [CLEAR_ENERGY]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [FORWARD_ENERGY_TOTAL]: {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  },
  [SWITCH_PREPAYMENT]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [PHASE_A]: {
    category: DEVICE_FEATURE_CATEGORIES.DATA,
    type: DEVICE_FEATURE_TYPES.SENSOR.JSON,
  },
  [EVENT_CLEAR]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [SWITCH_EVENT]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [AIR_CONDITIONING_POWER]: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  [AIR_CONDITIONING_MODE]: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
  },
  [AIR_CONDITIONING_TEMPERATURE]: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
  },
  [AIR_CONDITIONING_FAN_SPEED]: {
    category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED,
  },

  // TV
  [TV_POWER]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.POWER,
  },
  [TV_CHANNEL_UP]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_UP,
  },
  [TV_CHANNEL_DOWN]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL_DOWN,
  },
  [TV_VOLUME_UP]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP,
  },
  [TV_VOLUME_DOWN]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN,
  },
  [TV_MUTE]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.MUTE,
  },
  [TV_MENU]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.MENU,
  },
  [TV_BACK]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.BACK,
  },
  [TV_UP]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.UP,
  },
  [TV_DOWN]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.DOWN,
  },
  [TV_LEFT]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.LEFT,
  },
  [TV_RIGHT]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.RIGHT,
  },
  [TV_EXIT]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.EXIT,
  },
  [TV_HOME]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.HOME,
  },
  [TV_OK]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.OK,
  },
  [TV_1]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_2]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_3]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_4]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_5]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_6]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_7]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION, 
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_8]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_9]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
  },
  [TV_0]: {
    category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
    type: DEVICE_FEATURE_TYPES.TELEVISION.KEY,
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
  [DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      return valueFromDevice
    },
  },
  [DEVICE_FEATURE_CATEGORIES.DATA]: {
    [DEVICE_FEATURE_TYPES.SENSOR.JSON]: (valueFromDevice) => {
      return JSON.stringify(valueFromDevice);
    },
  },
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.POWER]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: (valueFromDevice) => {
      return parseInt(valueFromDevice, 10);
    },
  },
};

module.exports = { mappings, readValues, writeValues };
