const { FAN_MODE, FAN_ROCK_SETTING, FAN_WIND_SETTING } = require('../../../utils/constants');

// Matter FanControl cluster FanModeEnum values (Matter spec 4.4.5.5)
const MATTER_FAN_MODE = {
  OFF: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  ON: 4,
  AUTO: 5,
  SMART: 6,
};

const MATTER_FAN_MODE_TO_GLADYS = {
  [MATTER_FAN_MODE.OFF]: FAN_MODE.OFF,
  [MATTER_FAN_MODE.LOW]: FAN_MODE.LOW,
  [MATTER_FAN_MODE.MEDIUM]: FAN_MODE.MEDIUM,
  [MATTER_FAN_MODE.HIGH]: FAN_MODE.HIGH,
  [MATTER_FAN_MODE.ON]: FAN_MODE.HIGH,
  [MATTER_FAN_MODE.AUTO]: FAN_MODE.AUTO,
  [MATTER_FAN_MODE.SMART]: FAN_MODE.AUTO,
};

const GLADYS_FAN_MODE_TO_MATTER = {
  [FAN_MODE.OFF]: MATTER_FAN_MODE.OFF,
  [FAN_MODE.LOW]: MATTER_FAN_MODE.LOW,
  [FAN_MODE.MEDIUM]: MATTER_FAN_MODE.MEDIUM,
  [FAN_MODE.HIGH]: MATTER_FAN_MODE.HIGH,
  [FAN_MODE.AUTO]: MATTER_FAN_MODE.AUTO,
};

const GLADYS_ROCK_SETTING_TO_MATTER = {
  [FAN_ROCK_SETTING.OFF]: {},
  [FAN_ROCK_SETTING.LEFT_RIGHT]: { rockLeftRight: true },
  [FAN_ROCK_SETTING.UP_DOWN]: { rockUpDown: true },
  [FAN_ROCK_SETTING.LEFT_RIGHT_AND_UP_DOWN]: { rockLeftRight: true, rockUpDown: true },
  [FAN_ROCK_SETTING.ROUND]: { rockRound: true },
  [FAN_ROCK_SETTING.LEFT_RIGHT_AND_ROUND]: { rockLeftRight: true, rockRound: true },
  [FAN_ROCK_SETTING.UP_DOWN_AND_ROUND]: { rockUpDown: true, rockRound: true },
  [FAN_ROCK_SETTING.ALL]: { rockLeftRight: true, rockUpDown: true, rockRound: true },
};

const GLADYS_WIND_SETTING_TO_MATTER = {
  [FAN_WIND_SETTING.OFF]: {},
  [FAN_WIND_SETTING.SLEEP]: { sleepWind: true },
  [FAN_WIND_SETTING.NATURAL]: { naturalWind: true },
  [FAN_WIND_SETTING.SLEEP_AND_NATURAL]: { sleepWind: true, naturalWind: true },
};

const MATTER_BITMAP_BITS = {
  RockBitmap: { rockLeftRight: 0, rockUpDown: 1, rockRound: 2 },
  WindBitmap: { sleepWind: 0, naturalWind: 1 },
};

/**
 * @description Encode a Matter bitmap object to a numeric value.
 * @param {object} value - Bitmap object (e.g. { rockLeftRight: true }).
 * @param {object} bitMap - Bit positions for each field.
 * @returns {number} Encoded bitmap value.
 * @example
 * encodeMatterBitmap({ rockLeftRight: true }, { rockLeftRight: 0, rockUpDown: 1 });
 */
function encodeMatterBitmap(value, bitMap) {
  return Object.entries(bitMap).reduce((result, [key, bit]) => {
    if (value[key]) {
      return result + 2 ** bit;
    }
    return result;
  }, 0);
}

/**
 * @description Convert Matter FanMode attribute value to Gladys fan mode.
 * @param {number} matterFanMode - FanMode value from Matter device.
 * @returns {number} Gladys FAN_MODE value.
 * @example
 * const gladysMode = matterFanModeToGladys(5);
 */
function matterFanModeToGladys(matterFanMode) {
  if (Object.prototype.hasOwnProperty.call(MATTER_FAN_MODE_TO_GLADYS, matterFanMode)) {
    return MATTER_FAN_MODE_TO_GLADYS[matterFanMode];
  }
  return matterFanMode;
}

/**
 * @description Convert Gladys fan mode to Matter FanMode attribute value.
 * @param {number} gladysFanMode - Gladys FAN_MODE value.
 * @returns {number} Matter FanMode value.
 * @example
 * const matterMode = gladysFanModeToMatter(4);
 */
function gladysFanModeToMatter(gladysFanMode) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_FAN_MODE_TO_MATTER, gladysFanMode)) {
    return GLADYS_FAN_MODE_TO_MATTER[gladysFanMode];
  }
  return gladysFanMode;
}

/**
 * @description Convert a Matter attribute value to a numeric value.
 * Matter.js may return bitmap attributes as objects (e.g. { rockLeftRight: true }).
 * @param {number|object} value - Attribute value from Matter device.
 * @param {object} [schema] - Matter attribute schema used to encode bitmap values.
 * @returns {number|undefined} Numeric attribute value.
 * @example
 * const rockSupport = matterAttributeToNumber({ rockLeftRight: true }, rockSupportSchema);
 */
function matterAttributeToNumber(value, schema) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value !== null && value !== undefined && typeof value === 'object' && schema) {
    if (typeof schema.encode === 'function') {
      const encoded = schema.encode(value);
      return encoded[encoded.length - 1];
    }
    const bitMap = MATTER_BITMAP_BITS[schema.type];
    if (bitMap) {
      return encodeMatterBitmap(value, bitMap);
    }
  }
  if (value !== null && value !== undefined) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return undefined;
}

/**
 * @description Convert Gladys rock setting to Matter RockSetting bitmap object.
 * @param {number} gladysRockSetting - Gladys FAN_ROCK_SETTING value.
 * @returns {object} Matter RockSetting bitmap object.
 * @example
 * const matterRock = gladysRockSettingToMatter(1);
 */
function gladysRockSettingToMatter(gladysRockSetting) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_ROCK_SETTING_TO_MATTER, gladysRockSetting)) {
    return GLADYS_ROCK_SETTING_TO_MATTER[gladysRockSetting];
  }
  return {};
}

/**
 * @description Convert Gladys wind setting to Matter WindSetting bitmap object.
 * @param {number} gladysWindSetting - Gladys FAN_WIND_SETTING value.
 * @returns {object} Matter WindSetting bitmap object.
 * @example
 * const matterWind = gladysWindSettingToMatter(2);
 */
function gladysWindSettingToMatter(gladysWindSetting) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_WIND_SETTING_TO_MATTER, gladysWindSetting)) {
    return GLADYS_WIND_SETTING_TO_MATTER[gladysWindSetting];
  }
  return {};
}

module.exports = {
  matterFanModeToGladys,
  gladysFanModeToMatter,
  matterAttributeToNumber,
  gladysRockSettingToMatter,
  gladysWindSettingToMatter,
};
