// How each THERMOSTAT_* device param maps onto the config the widget reads.
// Declaring it once removes the ninety lines of near-identical ternaries this
// used to be, and keeps the param names in a single place.
const PARAM_FIELDS = [
  ['temperature_feature', 'THERMOSTAT_TEMPERATURE_FEATURE'],
  ['humidity_feature', 'THERMOSTAT_HUMIDITY_FEATURE'],
  ['switch_feature', 'THERMOSTAT_SWITCH_FEATURE'],
  // External thermostats: the real device regulates itself, and these point at
  // features owned by another integration (Netatmo, Zigbee, Matter, MQTT...).
  ['thermostat_type', 'THERMOSTAT_TYPE'],
  ['target_feature', 'THERMOSTAT_TARGET_FEATURE'],
  ['state_feature', 'THERMOSTAT_STATE_FEATURE'],
  ['mode_feature', 'THERMOSTAT_MODE_FEATURE'],
  ['window_feature', 'THERMOSTAT_WINDOW_FEATURE'],
  ['active_schedule', 'THERMOSTAT_ACTIVE_SCHEDULE'],
  ['default_mode', 'THERMOSTAT_MODE'],
  ['control_type', 'THERMOSTAT_CONTROL_TYPE'],
  ['temp_min', 'THERMOSTAT_MIN_TEMP', parseFloat],
  ['temp_max', 'THERMOSTAT_MAX_TEMP', parseFloat],
  ['temp_unit', 'THERMOSTAT_TEMP_UNIT'],
  ['preset_frost', 'THERMOSTAT_PRESET_FROST', parseFloat],
  ['preset_away', 'THERMOSTAT_PRESET_AWAY', parseFloat],
  ['preset_eco', 'THERMOSTAT_PRESET_ECO', parseFloat],
  ['preset_night', 'THERMOSTAT_PRESET_NIGHT', parseFloat],
  ['preset_comfort', 'THERMOSTAT_PRESET_COMFORT', parseFloat],
  ['hysteresis_start', 'THERMOSTAT_HYSTERESIS_START', parseFloat],
  ['hysteresis_stop', 'THERMOSTAT_HYSTERESIS_STOP', parseFloat],
  ['tpi_cycle_time', 'THERMOSTAT_TPI_CYCLE_TIME', v => parseInt(v, 10)],
  ['tpi_proportional_band', 'THERMOSTAT_TPI_PROPORTIONAL_BAND', parseFloat],
  ['manual_duration', 'THERMOSTAT_MANUAL_DURATION', v => parseInt(v, 10)]
];

const DEFAULTS = { default_mode: 'heating', control_type: 'hysteresis', thermostat_type: 'virtual' };

/**
 * Build the widget config from a device's params. Returns null when the device
 * carries none, so the caller can fall back to the shared defaults.
 */
export const buildConfigFromParams = device => {
  if (!device || !device.params || device.params.length === 0) {
    return null;
  }
  const getParam = name => {
    const param = device.params.find(p => p.name === name);
    return param ? param.value : null;
  };
  const config = {};
  PARAM_FIELDS.forEach(([field, paramName, parse]) => {
    const raw = getParam(paramName);
    // `!raw` would treat '0' as empty, so a 0 °C hysteresis band read back as
    // the default instead of the saved value. Only null/undefined/'' are empty.
    if (raw === null || raw === undefined || raw === '') {
      config[field] = null;
      return;
    }
    const parsed = parse ? parse(raw) : raw;
    config[field] = typeof parsed === 'number' && !Number.isFinite(parsed) ? null : parsed;
  });
  return config;
};

/**
 * Read the thermostat config for a feature selector.
 *
 * Device params are the only store: the server regulation loop reads the very
 * same params, so the widget and the heater can never disagree on the settings.
 */
export const loadDeviceConfig = async (httpClient, thermostatFeature) => {
  if (!thermostatFeature) {
    return null;
  }

  let paramsConfig = null;
  try {
    // The config lives on this integration's own device, so it is looked up
    // among this service's thermostats — never by feature selector on
    // /api/v1/device. On an external thermostat that selector belongs to the
    // real device (a Netatmo, a Zigbee TRV...), which carries none of the
    // THERMOSTAT_* params: the lookup would silently return that device and
    // every setting would fall back to its default, the type included.
    const devices = await httpClient.get('/api/v1/service/thermostat/device');
    const device = (devices || []).find(
      candidate =>
        (candidate.features || []).some(feature => feature.selector === thermostatFeature) ||
        (candidate.params || []).some(
          param => param.name === 'THERMOSTAT_TARGET_FEATURE' && param.value === thermostatFeature
        )
    );
    paramsConfig = device ? buildConfigFromParams(device) : null;
  } catch (e) {
    paramsConfig = null;
  }

  if (!paramsConfig) {
    return { ...DEFAULTS };
  }

  // A param left empty falls back to the shared default rather than staying null.
  const merged = { ...paramsConfig };
  Object.keys(DEFAULTS).forEach(field => {
    if (merged[field] === null || merged[field] === undefined) {
      merged[field] = DEFAULTS[field];
    }
  });
  return merged;
};
