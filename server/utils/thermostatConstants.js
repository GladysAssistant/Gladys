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
// Safety floors for the regulation loop. The edit form advertises the same
// bounds, but an HTML `min` is only a browser hint: a device saved through the
// API can still carry a 0, which would divide by zero in the TPI computation
// (band) or modulo by zero in the cycle position (cycle time).
const MIN_TPI_CYCLE_TIME = 5;
const MAX_TPI_CYCLE_TIME = 120;
const MIN_TPI_PROPORTIONAL_BAND = 0.5;
const MAX_TPI_PROPORTIONAL_BAND = 10;

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

// How long an opening sensor has to stay open before the heating is suspended,
// in seconds. A door opened to come in and closed right behind should not cut
// the heating. Configurable per device through THERMOSTAT_WINDOW_DELAY; 0 cuts
// as soon as it opens.
const DEFAULT_WINDOW_DELAY_SECONDS = 60;
// And at most an hour. Beyond 2^31 - 1 ms (about 24.8 days) `setTimeout` fires
// after 1 ms instead: 3,000,000 s cut the heating at once, while the widget
// already said so and the server logged a TimeoutOverflowWarning. A window left
// open for more than an hour is no door opened to come in.
const MAX_WINDOW_DELAY_SECONDS = 3600;

// The preset names, as they are stored in a schedule transition and used to key
// DEFAULT_PRESET_TEMPS. `schedule` is not one of them: it is a state of the
// thermostat ("follow the programme"), carried by the preset feature, and a
// transition saying it would be the programme referring to itself.
const PRESETS = ['frost', 'away', 'eco', 'night', 'comfort'];

// What a transition point accepts: a preset, or `off`. Stopping is a mode
// (THERMOSTAT_MODE.OFF) rather than a preset, but a programme may legitimately
// stop the heating, so the column's domain is wider than the preset enum.
const TRANSITION_PRESETS = [...PRESETS, 'off'];

// How a thermostat device is regulated.
// - `virtual`: Gladys is the thermostat. It reads a room sensor, applies
//   hysteresis or TPI, and drives a switch (a relay, a plug, a boiler contact).
// - `external`: a real thermostat regulates on its own. Gladys only writes the
//   setpoint its schedule resolves, and reads back whether the device is
//   currently heating. There is no switch and no heuristic to run: the device
//   already does that, and a second control loop would fight it.
const THERMOSTAT_TYPES = {
  VIRTUAL: 'virtual',
  EXTERNAL: 'external',
};

// Devices created before the external type existed carry no THERMOSTAT_TYPE
// param, and they are all virtual ones.
const DEFAULT_THERMOSTAT_TYPE = THERMOSTAT_TYPES.VIRTUAL;

module.exports = {
  DEFAULT_PRESET_TEMPS,
  FALLBACK_SETPOINT,
  DEFAULT_HYSTERESIS_START,
  DEFAULT_HYSTERESIS_STOP,
  DEFAULT_TPI_CYCLE_TIME,
  DEFAULT_TPI_PROPORTIONAL_BAND,
  MIN_TPI_CYCLE_TIME,
  MAX_TPI_CYCLE_TIME,
  MIN_TPI_PROPORTIONAL_BAND,
  MAX_TPI_PROPORTIONAL_BAND,
  DEFAULT_MODE,
  DEFAULT_CONTROL_TYPE,
  DEFAULT_MIN_TEMP,
  DEFAULT_MAX_TEMP,
  DEFAULT_TEMP_UNIT,
  DEFAULT_MANUAL_DURATION_MINUTES,
  MANUAL_DURATION_MS,
  DEFAULT_WINDOW_DELAY_SECONDS,
  MAX_WINDOW_DELAY_SECONDS,
  PRESETS,
  TRANSITION_PRESETS,
  THERMOSTAT_TYPES,
  DEFAULT_THERMOSTAT_TYPE,
};
