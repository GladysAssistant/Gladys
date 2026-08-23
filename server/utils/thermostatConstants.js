// Single source of truth for the thermostat defaults, shared by the server
// regulation loop, the integration edit page and the dashboard widget. Keeping
// them here avoids the drift where the form offered one default and the
// regulation applied another.

const DEFAULT_PRESET_TEMPS = {
  frost: 7,
  away: 16,
  eco: 18,
  night: 17,
  comfort: 21,
};

// Fallback setpoint for a preset that is neither known nor configured.
const FALLBACK_SETPOINT = 20;

const DEFAULT_HYSTERESIS_START = 0.5;
const DEFAULT_HYSTERESIS_STOP = 0.5;
// Minutes. The integration form offers the same value, so a device saved
// without the param is regulated exactly as the form displayed it.
const DEFAULT_TPI_CYCLE_TIME = 30;
const DEFAULT_TPI_PROPORTIONAL_BAND = 2;

const DEFAULT_MODE = 'heating';
const DEFAULT_CONTROL_TYPE = 'hysteresis';

const DEFAULT_MIN_TEMP = 5;
const DEFAULT_MAX_TEMP = 35;
const DEFAULT_TEMP_UNIT = 'C';

// How long a manual setpoint (widget dial or scene) holds before the schedule
// takes over again. Configurable per device through THERMOSTAT_MANUAL_DURATION,
// which is expressed in minutes; this is the fallback when it is unset.
const DEFAULT_MANUAL_DURATION_MINUTES = 30;
const MANUAL_DURATION_MS = DEFAULT_MANUAL_DURATION_MINUTES * 60 * 1000;

const PRESETS = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];

module.exports = {
  DEFAULT_PRESET_TEMPS,
  FALLBACK_SETPOINT,
  DEFAULT_HYSTERESIS_START,
  DEFAULT_HYSTERESIS_STOP,
  DEFAULT_TPI_CYCLE_TIME,
  DEFAULT_TPI_PROPORTIONAL_BAND,
  DEFAULT_MODE,
  DEFAULT_CONTROL_TYPE,
  DEFAULT_MIN_TEMP,
  DEFAULT_MAX_TEMP,
  DEFAULT_TEMP_UNIT,
  DEFAULT_MANUAL_DURATION_MINUTES,
  MANUAL_DURATION_MS,
  PRESETS,
};
