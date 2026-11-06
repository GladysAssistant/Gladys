// The presence rules of the thermostat (spec A.4), shared by the server
// regulation loop, the integration edit page and the dashboard widget, so the
// card shows the preset the loop regulates on and the form offers the sensors
// the loop reads.

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('./constants');
const { PRESETS, PILOT_WIRE_ORDER_RANK, supportedPilotWireOrder } = require('./thermostatConstants');

/**
 * @description Whether a feature can tell an empty room: a motion or presence
 * sensor reporting a state, 1 for someone and 0 for nobody. The `push` types
 * only say that something happened, never that it stopped.
 * @param {object} feature - A device feature.
 * @returns {boolean} True for a sensor the thermostat may read.
 * @example
 * isPresenceSensor({ category: 'motion-sensor', type: 'binary' }); // true
 */
function isPresenceSensor(feature) {
  return (
    !!feature &&
    (feature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR ||
      feature.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR) &&
    feature.type === DEVICE_FEATURE_TYPES.SENSOR.BINARY
  );
}

/**
 * @description The preset an empty room is regulated on: the absence preset
 * when it saves energy over the one in force, the one in force otherwise.
 *
 * Lower is a saving when heating, higher when cooling. A heater regulating
 * itself is weighed on the orders the module actually takes
 * (`supportedPilotWireOrder`), from the least heat to the most: two presets the
 * module resolves to the same order are no saving, and an order it takes none
 * of changes nothing. `off` and `schedule` name no temperature, and are left
 * alone.
 * @param {string} preset - The preset in force.
 * @param {string} absencePreset - THERMOSTAT_PRESENCE_PRESET.
 * @param {object} weigh - How to weigh the two presets.
 * @param {boolean} [weigh.cooling] - Whether the thermostat cools.
 * @param {Function} [weigh.setpointOf] - A preset's setpoint, when weighed on setpoints.
 * @param {Function} [weigh.orderOf] - A preset's configured pilot-wire order,
 * when the heater regulates itself.
 * @param {Array} [weigh.supportedOptions] - The pilot-wire feature's `supported_options`.
 * @returns {string} The preset to regulate on.
 * @example
 * presetSavingForEmptyRoom('comfort', 'eco', { setpointOf: (p) => ({ comfort: 21, eco: 18 })[p] }); // 'eco'
 */
function presetSavingForEmptyRoom(preset, absencePreset, { cooling = false, setpointOf, orderOf, supportedOptions }) {
  if (!PRESETS.includes(preset) || preset === absencePreset) {
    return preset;
  }
  if (orderOf) {
    const inForce = supportedPilotWireOrder(orderOf(preset), supportedOptions);
    const empty = supportedPilotWireOrder(orderOf(absencePreset), supportedOptions);
    const saves = inForce !== null && empty !== null && PILOT_WIRE_ORDER_RANK[empty] < PILOT_WIRE_ORDER_RANK[inForce];
    return saves ? absencePreset : preset;
  }
  const inForce = setpointOf(preset);
  const empty = setpointOf(absencePreset);
  const saves = cooling ? empty > inForce : empty < inForce;
  return saves ? absencePreset : preset;
}

/**
 * @description Whether an empty room lowers a preset picked by hand: only when
 * the room went empty after the hold was armed. A preset picked while the room
 * was already empty — Comfort set from the phone on the way home — is a
 * pre-heating, kept until someone is seen and the room empties again. A hold
 * whose arming time is unknown is lowered.
 * @param {number|null} holdSince - When the hold was armed, in ms (THERMOSTAT_MANUAL_SINCE).
 * @param {number} emptySince - Since when the room has been empty, in ms.
 * @returns {boolean} True when the absence preset applies over the hold.
 * @example
 * absenceLowersHold(Date.parse('2026-11-06T17:00Z'), Date.parse('2026-11-06T10:00Z')); // false
 */
function absenceLowersHold(holdSince, emptySince) {
  return !Number.isFinite(holdSince) || emptySince > holdSince;
}

module.exports = {
  isPresenceSensor,
  presetSavingForEmptyRoom,
  absenceLowersHold,
};
