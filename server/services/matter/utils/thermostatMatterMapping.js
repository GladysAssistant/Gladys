const { AC_MODE, THERMOSTAT_MODE } = require('../../../utils/constants');

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

// Thermostat-type features (heating-only devices) carry THERMOSTAT_MODE, which has an Off value
const MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT = {
  [MATTER_SYSTEM_MODE.OFF]: THERMOSTAT_MODE.OFF,
  [MATTER_SYSTEM_MODE.AUTO]: THERMOSTAT_MODE.AUTO,
  [MATTER_SYSTEM_MODE.COOL]: THERMOSTAT_MODE.COOLING,
  [MATTER_SYSTEM_MODE.HEAT]: THERMOSTAT_MODE.HEATING,
  [MATTER_SYSTEM_MODE.EMERGENCY_HEAT]: THERMOSTAT_MODE.HEATING,
  [MATTER_SYSTEM_MODE.PRECOOLING]: THERMOSTAT_MODE.COOLING,
};

const GLADYS_THERMOSTAT_MODE_TO_MATTER = {
  [THERMOSTAT_MODE.OFF]: MATTER_SYSTEM_MODE.OFF,
  [THERMOSTAT_MODE.HEATING]: MATTER_SYSTEM_MODE.HEAT,
  [THERMOSTAT_MODE.COOLING]: MATTER_SYSTEM_MODE.COOL,
  [THERMOSTAT_MODE.AUTO]: MATTER_SYSTEM_MODE.AUTO,
};

const GLADYS_THERMOSTAT_MODE_LABELS = {
  [THERMOSTAT_MODE.OFF]: 'Off',
  [THERMOSTAT_MODE.HEATING]: 'Heat',
  [THERMOSTAT_MODE.COOLING]: 'Cool',
  [THERMOSTAT_MODE.AUTO]: 'Auto',
};

// Defaults of the Matter specification for the absolute setpoint limits (in 0.01 °C),
// used when the device does not expose them
const DEFAULT_SETPOINT_LIMITS = {
  heating: { min: 700, max: 3000 },
  cooling: { min: 1600, max: 3200 },
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
 * Returns null when the mode has no Gladys equivalent (e.g. Off, which is carried by the
 * OnOff cluster, or by the air conditioning power feature on an endpoint without OnOff).
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

/**
 * @description Convert Matter Thermostat SystemMode attribute value to Gladys thermostat mode.
 * @param {number} matterSystemMode - SystemMode value from Matter device.
 * @returns {number|null} Gladys THERMOSTAT_MODE value, or null when not mappable (e.g. Dry, FanOnly).
 * @example
 * const gladysMode = matterSystemModeToGladysThermostatMode(0);
 */
function matterSystemModeToGladysThermostatMode(matterSystemMode) {
  if (Object.prototype.hasOwnProperty.call(MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT, matterSystemMode)) {
    return MATTER_SYSTEM_MODE_TO_GLADYS_THERMOSTAT[matterSystemMode];
  }
  return null;
}

/**
 * @description Convert Gladys thermostat mode to Matter Thermostat SystemMode attribute value.
 * @param {number} gladysThermostatMode - Gladys THERMOSTAT_MODE value.
 * @returns {number} Matter SystemMode value.
 * @example
 * const matterSystemMode = gladysThermostatModeToMatterSystemMode(0);
 */
function gladysThermostatModeToMatterSystemMode(gladysThermostatMode) {
  if (Object.prototype.hasOwnProperty.call(GLADYS_THERMOSTAT_MODE_TO_MATTER, gladysThermostatMode)) {
    return GLADYS_THERMOSTAT_MODE_TO_MATTER[gladysThermostatMode];
  }
  throw new Error(`Unsupported thermostat mode: ${gladysThermostatMode}`);
}

/**
 * @description Build the supported_options list of the thermostat mode feature
 * from the Thermostat cluster supported features. Off is always supported.
 * @param {object} supportedFeatures - Thermostat cluster supported features (heating/cooling/autoMode).
 * @returns {Array} Supported options ({ value, label }) sorted by Gladys THERMOSTAT_MODE value.
 * @example
 * const supportedOptions = getThermostatModeSupportedOptions({ heating: true });
 */
function getThermostatModeSupportedOptions(supportedFeatures) {
  const modes = [THERMOSTAT_MODE.OFF];
  if (supportedFeatures.heating) {
    modes.push(THERMOSTAT_MODE.HEATING);
  }
  if (supportedFeatures.cooling) {
    modes.push(THERMOSTAT_MODE.COOLING);
  }
  if (supportedFeatures.autoMode) {
    modes.push(THERMOSTAT_MODE.AUTO);
  }
  return modes
    .sort((a, b) => a - b)
    .map((mode) => ({
      value: mode,
      label: GLADYS_THERMOSTAT_MODE_LABELS[mode],
    }));
}

/**
 * @description Read one setpoint limit attribute (in 0.01 °C), ignoring attributes
 * the device does not implement and read errors.
 * @param {object} thermostat - Thermostat cluster client.
 * @param {string} getterName - Name of the attribute getter.
 * @returns {Promise<number|null>} The limit, or null when unavailable.
 * @example
 * const limit = await readSetpointLimit(thermostat, 'getMinHeatSetpointLimitAttribute');
 */
async function readSetpointLimit(thermostat, getterName) {
  if (typeof thermostat[getterName] !== 'function') {
    return null;
  }
  try {
    const value = await thermostat[getterName]();
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch (e) {
    return null;
  }
}

/**
 * @description Read the range of one setpoint: the user limits (Min/Max…SetpointLimit),
 * else the absolute limits of the device (AbsMin/AbsMax…SetpointLimit), else the defaults
 * of the Matter specification. An inverted range, or one with no width, falls back on the defaults.
 * @param {object} thermostat - Thermostat cluster client.
 * @param {string} kind - 'Heat' or 'Cool'.
 * @param {object} defaults - Default { min, max } in 0.01 °C.
 * @returns {Promise<object>} The { min, max } range in °C.
 * @example
 * const range = await readSetpointRange(thermostat, 'Heat', { min: 700, max: 3000 });
 */
async function readSetpointRange(thermostat, kind, defaults) {
  const min =
    (await readSetpointLimit(thermostat, `getMin${kind}SetpointLimitAttribute`)) ??
    (await readSetpointLimit(thermostat, `getAbsMin${kind}SetpointLimitAttribute`)) ??
    defaults.min;
  const max =
    (await readSetpointLimit(thermostat, `getMax${kind}SetpointLimitAttribute`)) ??
    (await readSetpointLimit(thermostat, `getAbsMax${kind}SetpointLimitAttribute`)) ??
    defaults.max;
  if (min >= max) {
    return { min: defaults.min / 100, max: defaults.max / 100 };
  }
  return { min: min / 100, max: max / 100 };
}

/**
 * @description Read the heating and cooling setpoint ranges advertised by a Matter thermostat.
 * @param {object} thermostat - Thermostat cluster client.
 * @returns {Promise<object>} { heating: { min, max }, cooling: { min, max } } in °C.
 * @example
 * const { heating, cooling } = await getSetpointLimits(thermostat);
 */
async function getSetpointLimits(thermostat) {
  const heating = await readSetpointRange(thermostat, 'Heat', DEFAULT_SETPOINT_LIMITS.heating);
  const cooling = await readSetpointRange(thermostat, 'Cool', DEFAULT_SETPOINT_LIMITS.cooling);
  return { heating, cooling };
}

module.exports = {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
  getAcModeSupportedOptions,
  matterSystemModeToGladysThermostatMode,
  gladysThermostatModeToMatterSystemMode,
  getThermostatModeSupportedOptions,
  getSetpointLimits,
};
