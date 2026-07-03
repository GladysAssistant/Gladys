const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES, PILOT_WIRE_MODE } = require('../../../../../utils/constants');

// Konyks eCosy (HZTY001, product_id evyy1wbhi4t7uftn): a standard-`wk` pilot-wire thermostat whose
// mode enum uses its own vocabulary (6 orders). Off is not a mode on this device: on/off is the
// dedicated `switch` DPS 1, and there is no Thermostat order either, so PILOT_WIRE_MODE.OFF and
// PILOT_WIRE_MODE.THERMOSTAT have no Tuya value here (writing them is rejected by setValue).
// `auto` follows the weekly program (week_data), hence PROGRAMMING.
const ECOSY_PILOT_WIRE_TUYA_ENUM = {
  hot: PILOT_WIRE_MODE.COMFORT,
  eco: PILOT_WIRE_MODE.ECO,
  cold: PILOT_WIRE_MODE.FROST_PROTECTION,
  comfortable1: PILOT_WIRE_MODE.COMFORT_1,
  comfortable2: PILOT_WIRE_MODE.COMFORT_2,
  auto: PILOT_WIRE_MODE.PROGRAMMING,
};

// Curated names: the four binary features collide with each other on `type`, and mode/cur_mode
// collide too, so the frontend falls back to feature.name instead of the localized category label.
module.exports = {
  // temp_set is ignored on purpose: this module has no temperature probe, the Konyks app does not
  // expose a setpoint, and writing DPS 16 has no visible effect (tuya-local does not expose it either).
  ignoredCodes: ['temp_set', 'travel_time', 'week_data'],
  switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    name: 'Switch',
    has_feedback: true,
  },
  mode: {
    category: DEVICE_FEATURE_CATEGORIES.HEATER,
    type: DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE,
    name: 'Mode',
    has_feedback: true,
    tuyaEnum: ECOSY_PILOT_WIRE_TUYA_ENUM,
  },
  cur_mode: {
    category: DEVICE_FEATURE_CATEGORIES.HEATER,
    type: DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE,
    name: 'Current mode',
    // The thing model advertises cur_mode as rw but it is the status mirror of `mode`.
    read_only: true,
    tuyaEnum: ECOSY_PILOT_WIRE_TUYA_ENUM,
  },
  timer_switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    name: 'Program',
    has_feedback: true,
  },
  travel_switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    name: 'Holiday mode',
    has_feedback: true,
  },
  lock_switch: {
    category: DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
    type: DEVICE_FEATURE_TYPES.CHILD_LOCK.BINARY,
    name: 'Child lock',
    has_feedback: true,
  },
};
