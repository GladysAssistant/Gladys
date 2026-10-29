const {
  defaultPresetTemps,
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
  PILOT_WIRE_REGULATIONS,
  DEFAULT_PILOT_WIRE_ORDERS,
} = require('../../../utils/thermostatConstants');
const { THERMOSTAT_MODE, PILOT_WIRE_MODE } = require('../../../utils/constants');
const { parseSelectorList } = require('../../../utils/thermostatSelectorList');

const PILOT_WIRE_ORDERS = Object.values(PILOT_WIRE_MODE);

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
  const storedType = getParam('THERMOSTAT_TYPE') || DEFAULT_THERMOSTAT_TYPE;
  // A real thermostat given a pilot wire was how a heater regulating itself was
  // saved before it had a type of its own: it is read as one.
  const thermostatType =
    storedType === THERMOSTAT_TYPES.EXTERNAL && getParam('THERMOSTAT_PILOT_WIRE_FEATURE')
      ? THERMOSTAT_TYPES.PILOT_WIRE
      : storedType;
  // The order a preset sends a heater that regulates itself: the param when it
  // names one of the six orders, the default otherwise.
  const pilotWireOrder = (preset) => {
    const value = toNumber(getParam(`THERMOSTAT_PILOT_WIRE_ORDER_${preset.toUpperCase()}`), null);
    return PILOT_WIRE_ORDERS.includes(value) ? value : DEFAULT_PILOT_WIRE_ORDERS[preset];
  };
  // A thermostat that cools aims higher: its presets default accordingly.
  const presetDefaults = defaultPresetTemps(getParam('THERMOSTAT_MODE') || DEFAULT_MODE);
  // One sensor or several (A.1.1): the loop regulates on their average.
  const temperatureFeatures = parseSelectorList(getParam('THERMOSTAT_TEMPERATURE_FEATURE'));
  return {
    temperature_features: temperatureFeatures,
    humidity_feature: getParam('THERMOSTAT_HUMIDITY_FEATURE') || null,
    switch_feature: getParam('THERMOSTAT_SWITCH_FEATURE') || null,
    pilot_wire_feature: getParam('THERMOSTAT_PILOT_WIRE_FEATURE') || null,
    // Who regulates the pilot-wire heater (C.1.1): the thermostat type says it.
    // A virtual one is Gladys, on its room sensor — without one there is nothing
    // to regulate on, and the heater regulates instead, as on a `pilot-wire` one.
    pilot_wire_regulation:
      thermostatType === THERMOSTAT_TYPES.VIRTUAL && temperatureFeatures.length > 0
        ? PILOT_WIRE_REGULATIONS.GLADYS
        : PILOT_WIRE_REGULATIONS.HEATER,
    pilot_wire_orders: Object.keys(DEFAULT_PILOT_WIRE_ORDERS).reduce(
      (orders, preset) => ({ ...orders, [preset]: pilotWireOrder(preset) }),
      {},
    ),
    // External thermostats: the real device regulates itself. `target_feature`
    // is the setpoint Gladys writes, `state_feature` the heating state it reads
    // back, `mode_feature` the optional operating mode and `power_feature` the
    // optional power of the appliance — how an air conditioner, whose mode has no
    // off, is stopped. All of them point at features owned by another
    // integration (Netatmo, Zigbee, Matter, MQTT, an air conditioner...).
    thermostat_type: thermostatType,
    target_feature: getParam('THERMOSTAT_TARGET_FEATURE') || null,
    state_feature: getParam('THERMOSTAT_STATE_FEATURE') || null,
    mode_feature: getParam('THERMOSTAT_MODE_FEATURE') || null,
    power_feature: getParam('THERMOSTAT_POWER_FEATURE') || null,
    // One opening sensor or several (A.1.1): any of them open stops the heating.
    window_features: parseSelectorList(getParam('THERMOSTAT_WINDOW_FEATURE')),
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
    preset_frost: toNumber(getParam('THERMOSTAT_PRESET_FROST'), presetDefaults.frost),
    preset_away: toNumber(getParam('THERMOSTAT_PRESET_AWAY'), presetDefaults.away),
    preset_eco: toNumber(getParam('THERMOSTAT_PRESET_ECO'), presetDefaults.eco),
    preset_night: toNumber(getParam('THERMOSTAT_PRESET_NIGHT'), presetDefaults.night),
    preset_comfort: toNumber(getParam('THERMOSTAT_PRESET_COMFORT'), presetDefaults.comfort),
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
 * @description Whether a thermostat device is driven by a real external device
 * through its setpoint.
 *
 * A pilot-wire heater never is, on either of its types (`virtual` or
 * `pilot-wire`, C.1.1): it takes an order, not a setpoint, and owns its
 * setpoint feature. Every pilot-wire branch hangs off `!isExternal`.
 * @param {object|null} config - Config built by getDeviceConfig.
 * @returns {boolean} True when the device regulates itself on a setpoint Gladys writes.
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
