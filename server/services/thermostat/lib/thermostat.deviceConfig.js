const {
  DEFAULT_PRESET_TEMPS,
  DEFAULT_HYSTERESIS_START,
  DEFAULT_HYSTERESIS_STOP,
  DEFAULT_TPI_CYCLE_TIME,
  DEFAULT_TPI_PROPORTIONAL_BAND,
  DEFAULT_MODE,
  DEFAULT_CONTROL_TYPE,
  DEFAULT_MIN_TEMP,
  DEFAULT_MAX_TEMP,
  DEFAULT_TEMP_UNIT,
  DEFAULT_THERMOSTAT_TYPE,
  THERMOSTAT_TYPES,
} = require('../../../utils/thermostatConstants');
const { THERMOSTAT_MODE } = require('../../../utils/constants');

/**
 * @description Parse a value as a finite number, falling back to a default.
 * Unlike `parseFloat(x) || d`, a legitimate 0 is preserved.
 * @param {*} value - Raw value (string, number, null...).
 * @param {number|null} defaultValue - Fallback when the value is not a finite number.
 * @returns {number|null} Parsed number or the default.
 * @example
 * toNumber('0', 7); // 0
 */
function toNumber(value, defaultValue) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : defaultValue;
}

/**
 * @description Build a thermostat config object from device params.
 * @param {object} device - Thermostat device with params.
 * @returns {object|null} Config object, or null when the device has no params.
 * @example
 * const config = buildParamsConfig(device);
 */
function buildParamsConfig(device) {
  if (!device.params || device.params.length === 0) {
    return null;
  }
  const getParam = (name) => {
    const p = device.params.find((x) => x.name === name);
    return p ? p.value : null;
  };
  return {
    temperature_feature: getParam('THERMOSTAT_TEMPERATURE_FEATURE') || null,
    humidity_feature: getParam('THERMOSTAT_HUMIDITY_FEATURE') || null,
    switch_feature: getParam('THERMOSTAT_SWITCH_FEATURE') || null,
    // External thermostats: the real device regulates itself. `target_feature`
    // is the setpoint Gladys writes, `state_feature` the heating state it reads
    // back, `mode_feature` the optional operating mode. All three point at
    // features owned by another integration (Netatmo, Zigbee, Matter, MQTT...).
    thermostat_type: getParam('THERMOSTAT_TYPE') || DEFAULT_THERMOSTAT_TYPE,
    target_feature: getParam('THERMOSTAT_TARGET_FEATURE') || null,
    state_feature: getParam('THERMOSTAT_STATE_FEATURE') || null,
    mode_feature: getParam('THERMOSTAT_MODE_FEATURE') || null,
    window_feature: getParam('THERMOSTAT_WINDOW_FEATURE') || null,
    default_mode: getParam('THERMOSTAT_MODE') || DEFAULT_MODE,
    control_type: getParam('THERMOSTAT_CONTROL_TYPE') || DEFAULT_CONTROL_TYPE,
    temp_min: toNumber(getParam('THERMOSTAT_MIN_TEMP'), DEFAULT_MIN_TEMP),
    temp_max: toNumber(getParam('THERMOSTAT_MAX_TEMP'), DEFAULT_MAX_TEMP),
    temp_unit: getParam('THERMOSTAT_TEMP_UNIT') || DEFAULT_TEMP_UNIT,
    // Null rather than the default when the param is absent: an absent duration
    // is a setting of its own — "hand the thermostat back at the next schedule
    // point" (C.3), the Tado and Netatmo behaviour — and filling it in here made
    // that unreachable, since `holdExpiry` can then never see the absence. The
    // callers that need a number apply the default themselves.
    manual_duration: toNumber(getParam('THERMOSTAT_MANUAL_DURATION'), null),
    preset_frost: toNumber(getParam('THERMOSTAT_PRESET_FROST'), DEFAULT_PRESET_TEMPS.frost),
    preset_away: toNumber(getParam('THERMOSTAT_PRESET_AWAY'), DEFAULT_PRESET_TEMPS.away),
    preset_eco: toNumber(getParam('THERMOSTAT_PRESET_ECO'), DEFAULT_PRESET_TEMPS.eco),
    preset_night: toNumber(getParam('THERMOSTAT_PRESET_NIGHT'), DEFAULT_PRESET_TEMPS.night),
    preset_comfort: toNumber(getParam('THERMOSTAT_PRESET_COMFORT'), DEFAULT_PRESET_TEMPS.comfort),
    hysteresis_start: toNumber(getParam('THERMOSTAT_HYSTERESIS_START'), DEFAULT_HYSTERESIS_START),
    hysteresis_stop: toNumber(getParam('THERMOSTAT_HYSTERESIS_STOP'), DEFAULT_HYSTERESIS_STOP),
    tpi_cycle_time: toNumber(getParam('THERMOSTAT_TPI_CYCLE_TIME'), DEFAULT_TPI_CYCLE_TIME),
    tpi_proportional_band: toNumber(getParam('THERMOSTAT_TPI_PROPORTIONAL_BAND'), DEFAULT_TPI_PROPORTIONAL_BAND),
  };
}

/**
 * @description Load the full config of a thermostat device.
 * Device params are the single source of truth: a control loop that actuates
 * real heaters must not depend on a JSON blob in the variable table that only
 * the integration page ever wrote.
 * @param {object} device - Thermostat device.
 * @returns {object|null} Config built from the device params, or null.
 * @example
 * const config = getDeviceConfig(device);
 */
function getDeviceConfig(device) {
  return buildParamsConfig(device);
}

/**
 * @description Whether a thermostat device is driven by a real external device.
 * @param {object|null} config - Config built by getDeviceConfig.
 * @returns {boolean} True when the device regulates itself.
 * @example
 * if (isExternal(config)) { ... }
 */
function isExternal(config) {
  return Boolean(config) && config.thermostat_type === THERMOSTAT_TYPES.EXTERNAL;
}

/**
 * @description Fetch a device feature (and its device) by feature selector.
 * @param {object} gladys - Gladys instance.
 * @param {string} selector - Device feature selector.
 * @returns {Promise<{device: object, feature: object}|null>} Device + feature, or null.
 * @example
 * const found = await getFeatureBySelector(gladys, 'heater-switch');
 */
async function getFeatureBySelector(gladys, selector) {
  const devices = await gladys.device.get({ device_feature_selectors: selector });
  const device = devices && devices[0];
  const feature = device && device.features.find((f) => f.selector === selector);
  return device && feature ? { device, feature } : null;
}

/**
 * @description The THERMOSTAT_MODE value a running thermostat carries.
 * The thermostat's own `default_mode` param is the intent the user configured
 * ("this device heats" / "this device cools"), and it is what the mode is handed
 * back to when the thermostat starts again — after a stop, or after an `off`
 * slot on an external thermostat.
 * @param {object} config - Thermostat config object.
 * @returns {number} A value from the THERMOSTAT_MODE enum.
 * @example
 * getRunningMode({ default_mode: 'cooling' }); // THERMOSTAT_MODE.COOLING
 */
function getRunningMode(config) {
  return config && config.default_mode === 'cooling' ? THERMOSTAT_MODE.COOLING : THERMOSTAT_MODE.HEATING;
}

module.exports = {
  toNumber,
  buildParamsConfig,
  getRunningMode,
  getDeviceConfig,
  getFeatureBySelector,
  isExternal,
};
