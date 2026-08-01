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

const GLADYS_AC_MODE_LABELS = {
  [AC_MODE.AUTO]: 'Auto',
  [AC_MODE.COOLING]: 'Cool',
  [AC_MODE.HEATING]: 'Heat',
  [AC_MODE.DRYING]: 'Dry',
  [AC_MODE.FAN]: 'Fan',
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

/**
 * @description Build the supported_options list of the air conditioning mode feature
 * from the Thermostat cluster supported features.
 * The Matter Thermostat cluster has no capability flag for the Dry and FanOnly
 * system modes, so they are always exposed on cooling devices.
 * @param {object} supportedFeatures - Thermostat cluster supported features (heating/cooling/autoMode).
 * @returns {Array} Supported options ({ value, label }) sorted by Gladys AC_MODE value.
 * @example
 * const supportedOptions = getAcModeSupportedOptions({ heating: true, cooling: true, autoMode: true });
 */
function getAcModeSupportedOptions(supportedFeatures) {
  const modes = [];
  if (supportedFeatures.autoMode) {
    modes.push(AC_MODE.AUTO);
  }
  if (supportedFeatures.cooling) {
    modes.push(AC_MODE.COOLING);
    // Dry and FanOnly have no Matter capability flag; expose them on cooling devices
    modes.push(AC_MODE.DRYING, AC_MODE.FAN);
  }
  if (supportedFeatures.heating) {
    modes.push(AC_MODE.HEATING);
  }
  return modes
    .sort((a, b) => a - b)
    .map((mode) => ({
      value: mode,
      label: GLADYS_AC_MODE_LABELS[mode],
    }));
}

module.exports = {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
  getAcModeSupportedOptions,
};
