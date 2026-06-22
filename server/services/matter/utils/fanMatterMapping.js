const { FAN_MODE } = require('../../../utils/constants');

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
    const encoded = schema.encode(value);
    return encoded[encoded.length - 1];
  }
  if (value !== null && value !== undefined) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return undefined;
}

module.exports = {
  matterFanModeToGladys,
  gladysFanModeToMatter,
  matterAttributeToNumber,
};
