const { AC_MODE } = require('../../../utils/constants');

// Matter Thermostat cluster SystemModeEnum values (Matter spec 4.3.9.10)
const MATTER_SYSTEM_MODE = {
  OFF: 0,
  AUTO: 1,
  COOL: 3,
  HEAT: 4,
  EMERGENCY_HEAT: 5,
  PRECOOLING: 6,
  FAN_ONLY: 7,
  DRY: 8,
  SLEEP: 9,
};

const MATTER_SYSTEM_MODE_TO_GLADYS = {
  [MATTER_SYSTEM_MODE.AUTO]: AC_MODE.AUTO,
  [MATTER_SYSTEM_MODE.COOL]: AC_MODE.COOLING,
  [MATTER_SYSTEM_MODE.HEAT]: AC_MODE.HEATING,
  [MATTER_SYSTEM_MODE.EMERGENCY_HEAT]: AC_MODE.HEATING,
  [MATTER_SYSTEM_MODE.PRECOOLING]: AC_MODE.COOLING,
  [MATTER_SYSTEM_MODE.FAN_ONLY]: AC_MODE.FAN,
  [MATTER_SYSTEM_MODE.DRY]: AC_MODE.DRYING,
  [MATTER_SYSTEM_MODE.SLEEP]: AC_MODE.AUTO,
};

const GLADYS_AC_MODE_TO_MATTER = {
  [AC_MODE.AUTO]: MATTER_SYSTEM_MODE.AUTO,
  [AC_MODE.COOLING]: MATTER_SYSTEM_MODE.COOL,
  [AC_MODE.HEATING]: MATTER_SYSTEM_MODE.HEAT,
  [AC_MODE.DRYING]: MATTER_SYSTEM_MODE.DRY,
  [AC_MODE.FAN]: MATTER_SYSTEM_MODE.FAN_ONLY,
};

/**
 * @description Convert Matter Thermostat SystemMode attribute value to Gladys AC mode.
 * Returns null when the mode has no Gladys equivalent (e.g. Off, which is handled
 * by the OnOff cluster / binary feature).
 * @param {number} matterSystemMode - SystemMode value from Matter device.
 * @returns {number|null} Gladys AC_MODE value, or null when not mappable.
 * @example
 * const gladysMode = matterSystemModeToGladysAcMode(3);
 */
function matterSystemModeToGladysAcMode(matterSystemMode) {
  if (Object.prototype.hasOwnProperty.call(MATTER_SYSTEM_MODE_TO_GLADYS, matterSystemMode)) {
    return MATTER_SYSTEM_MODE_TO_GLADYS[matterSystemMode];
  }
  return null;
}

/**
 * @description Convert Gladys AC mode to Matter Thermostat SystemMode attribute value.
 * @param {number} gladysAcMode - Gladys AC_MODE value.
 * @returns {number} Matter SystemMode value.
 * @example
 * const matterSystemMode = gladysAcModeToMatterSystemMode(1);
 */
function gladysAcModeToMatterSystemMode(gladysAcMode) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_AC_MODE_TO_MATTER, gladysAcMode)) {
    return GLADYS_AC_MODE_TO_MATTER[gladysAcMode];
  }
  throw new Error(`Unsupported air conditioning mode: ${gladysAcMode}`);
}

module.exports = {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
};
