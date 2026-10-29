// Single source of truth for the thermostat defaults, shared by the server
// regulation loop, the integration edit page and the dashboard widget. Keeping
// them here avoids the drift where the form offered one default and the
// regulation applied another.

const { PILOT_WIRE_MODE } = require('./constants');

const DEFAULT_PRESET_TEMPS = {
  frost: 7,
  away: 16,
  eco: 18,
  night: 17,
  comfort: 21,
};

// The same presets for a thermostat that cools: Comfort at 21 °C was a cold
// surprise on the first tap of an air conditioner. Frost protection becomes the
// heat it must never let the room reach.
const DEFAULT_COOLING_PRESET_TEMPS = {
  frost: 30,
  away: 28,
  eco: 26,
  night: 25,
  comfort: 24,
};

/**
 * @description The default preset temperatures for a thermostat's use.
 * @param {string} mode - `heating` or `cooling` (THERMOSTAT_MODE param).
 * @returns {object} The defaults, keyed by preset name, in °C.
 * @example
 * defaultPresetTemps('cooling').comfort; // 24
 */
function defaultPresetTemps(mode) {
  return mode === 'cooling' ? DEFAULT_COOLING_PRESET_TEMPS : DEFAULT_PRESET_TEMPS;
}

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
// after 1 ms instead: with 3,000,000 s the widget showed the banner at once and
// the server logged a TimeoutOverflowWarning, its early pass finding the delay
// not elapsed. A window left open for more than an hour is no door opened to
// come in.
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
//   hysteresis or TPI, and drives a switch (a relay, a plug, a boiler contact)
//   or a pilot-wire heater, used as a switch (C.1.1).
// - `external`: a real thermostat regulates on its own. Gladys only writes the
//   setpoint its schedule resolves, and reads back whether the device is
//   currently heating. There is no switch and no heuristic to run: the device
//   already does that, and a second control loop would fight it.
// - `pilot-wire`: a pilot-wire heater regulates on its own thermostat. Gladys
//   only sends it the order each preset is set to (C.1.1). It drives no real
//   setpoint, and owns its setpoint feature like a virtual thermostat.
const THERMOSTAT_TYPES = {
  VIRTUAL: 'virtual',
  EXTERNAL: 'external',
  PILOT_WIRE: 'pilot-wire',
};

// Devices created before the external type existed carry no THERMOSTAT_TYPE
// param, and they are all virtual ones.
const DEFAULT_THERMOSTAT_TYPE = THERMOSTAT_TYPES.VIRTUAL;

// Who regulates a pilot-wire heater (C.1.1). Not a param of its own: the
// thermostat type already says it.
// - `heater`, on a `pilot-wire` thermostat: the heater's own thermostat. Each
//   preset is sent as the order it is set to — eco is eco — and the room
//   sensor, if any, is only displayed.
// - `gladys`, on a virtual one: Gladys, on the room sensor. The wire is used as
//   a switch: comfort to heat, frost protection to stop, whatever the preset.
//   The heater's own comfort setpoint is set high, so its thermometer never has
//   the last word. Without a sensor there is nothing to regulate on, and the
//   heater regulates instead.
const PILOT_WIRE_REGULATIONS = {
  HEATER: 'heater',
  GLADYS: 'gladys',
};

// The order each preset sends a heater that regulates itself, each one set per
// thermostat by a THERMOSTAT_PILOT_WIRE_ORDER_<PRESET> param. A heater takes no
// temperature, so these replace the preset setpoints there. Away is frost
// protection, as Home Assistant's pilot-wire climate does: nobody is home.
// Night is eco, the order a heater's own programme gives the night; comfort -1
// and -2 stay on offer for whoever wants them.
const DEFAULT_PILOT_WIRE_ORDERS = {
  frost: PILOT_WIRE_MODE.FROST_PROTECTION,
  away: PILOT_WIRE_MODE.FROST_PROTECTION,
  eco: PILOT_WIRE_MODE.ECO,
  night: PILOT_WIRE_MODE.ECO,
  comfort: PILOT_WIRE_MODE.COMFORT,
};

const COMFORT_ORDERS = [PILOT_WIRE_MODE.COMFORT, PILOT_WIRE_MODE.COMFORT_1, PILOT_WIRE_MODE.COMFORT_2];

/**
 * @description The order a module can actually be sent, from the options its
 * feature declares. A 4-order module rejects comfort -1 and -2: written anyway,
 * the order was refused, written again on every pass, and the widget said it was
 * on its way for ever. Comfort -1 or -2 falls back on comfort when the module
 * takes it. Frost protection falls back on off: both are standby, and a module
 * that cannot hold frost protection would otherwise be left heating on the order
 * it carries — on comfort with a window open, or above the setpoint when Gladys
 * regulates. Any other order it does not take is not sent at all. A feature
 * that declares no option is sent the order as it is.
 * @param {number} order - A PILOT_WIRE_MODE value.
 * @param {Array} [supportedOptions] - The feature's `supported_options`.
 * @returns {number|null} The order to send, or null when the module takes none.
 * @example
 * supportedPilotWireOrder(PILOT_WIRE_MODE.COMFORT_1, [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 5 }]); // 5
 */
function supportedPilotWireOrder(order, supportedOptions) {
  const supported = (supportedOptions || []).map((option) => option.value);
  if (supported.length === 0 || supported.includes(order)) {
    return order;
  }
  if (COMFORT_ORDERS.includes(order) && supported.includes(PILOT_WIRE_MODE.COMFORT)) {
    return PILOT_WIRE_MODE.COMFORT;
  }
  if (order === PILOT_WIRE_MODE.FROST_PROTECTION && supported.includes(PILOT_WIRE_MODE.OFF)) {
    return PILOT_WIRE_MODE.OFF;
  }
  return null;
}

module.exports = {
  DEFAULT_PRESET_TEMPS,
  DEFAULT_COOLING_PRESET_TEMPS,
  defaultPresetTemps,
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
  PILOT_WIRE_REGULATIONS,
  DEFAULT_PILOT_WIRE_ORDERS,
  supportedPilotWireOrder,
};
