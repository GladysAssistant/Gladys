const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET,
} = require('../../../utils/constants');
const { PRESETS } = require('../../../utils/thermostatConstants');

const APPLY_DEBOUNCE_MS = 2000;

// The manual hold, as device params. A hold is bookkeeping of this regulation
// loop rather than a property of the equipment, so it is not a feature — but it
// is per-device configuration-shaped state, which is what params are for.
const MANUAL_SETPOINT_PARAM = 'THERMOSTAT_MANUAL_SETPOINT';
const MANUAL_UNTIL_PARAM = 'THERMOSTAT_MANUAL_UNTIL';

// THERMOSTAT_PRESET is an integer enum on the feature, while a schedule
// transition and the THERMOSTAT_PRESET_* params name their preset. This is the
// one place that maps between the two.
const PRESET_NAME_BY_VALUE = {
  [THERMOSTAT_PRESET.SCHEDULE]: 'schedule',
  [THERMOSTAT_PRESET.FROST]: 'frost',
  [THERMOSTAT_PRESET.AWAY]: 'away',
  [THERMOSTAT_PRESET.ECO]: 'eco',
  [THERMOSTAT_PRESET.NIGHT]: 'night',
  [THERMOSTAT_PRESET.COMFORT]: 'comfort',
};
const PRESET_VALUE_BY_NAME = Object.entries(PRESET_NAME_BY_VALUE).reduce(
  (acc, [value, name]) => ({ ...acc, [name]: Number(value) }),
  {},
);

/**
 * @description The preset name for an enum value, or null when the value names
 * no preset — a feature carrying a value written before a preset was removed,
 * or never written at all.
 * @param {number|string|null} value - The feature's last_value.
 * @returns {string|null} The preset name.
 * @example
 * presetName(5); // 'comfort'
 */
function presetName(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return PRESET_NAME_BY_VALUE[Number(value)] || null;
}

/**
 * @description The enum value for a preset name, or null for an unknown name.
 * `off` is deliberately not one: stopping is a mode.
 * @param {string|null} name - The preset name.
 * @returns {number|null} The THERMOSTAT_PRESET value.
 * @example
 * presetValue('comfort'); // 5
 */
function presetValue(name) {
  if (!name) {
    return null;
  }
  const value = PRESET_VALUE_BY_NAME[name];
  return value === undefined ? null : value;
}

/**
 * @description Find one of a thermostat's own features by type.
 * Resolved by category and type rather than by index: feature order is not a
 * contract, and a thermostat now carries several features.
 * @param {object} device - The thermostat device.
 * @param {string} type - A DEVICE_FEATURE_TYPES.THERMOSTAT value.
 * @returns {object|null} The feature, or null when the device has none.
 * @example
 * getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
 */
function getFeature(device, type) {
  if (!device || !Array.isArray(device.features)) {
    return null;
  }
  return (
    device.features.find(
      (feature) => feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT && feature.type === type,
    ) || null
  );
}

/**
 * @description The preset a thermostat currently carries, as a name.
 * @param {object} device - The thermostat device.
 * @returns {string|null} The preset name, or null when it carries none.
 * @example
 * getPreset(device); // 'comfort'
 */
function getPreset(device) {
  const feature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
  return feature ? presetName(feature.last_value) : null;
}

/**
 * @description Whether the thermostat has been stopped by hand: its mode feature
 * reads OFF.
 *
 * A stop is not a preset with a low setpoint, it is the machine switched off, so
 * it outranks the programme: without this the regulation pass triggered by the
 * stop itself would resolve the schedule's preset and start the heating again
 * within seconds. It holds until a mode is written back.
 * @param {object} device - The thermostat device.
 * @returns {boolean} True when the thermostat is stopped.
 * @example
 * isStopped(device);
 */
function isStopped(device) {
  const feature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
  // A mode that was never written carries null, and `Number(null)` is 0 — which
  // is OFF. Checking the value is there before comparing it is what keeps a
  // thermostat whose mode feature has never been set from reading as stopped.
  if (!feature || feature.last_value === null || feature.last_value === undefined) {
    return false;
  }
  return Number(feature.last_value) === THERMOSTAT_MODE.OFF;
}

/**
 * @description Write a preset on the thermostat's preset feature.
 * @param {object} device - The thermostat device.
 * @param {string} name - A preset name, `schedule` included.
 * @param {boolean} [force] - Broadcast even when the stored value did not move.
 * @returns {Promise<boolean>} True when the feature was written.
 * @example
 * await savePreset.call(this, device, 'comfort');
 */
async function savePreset(device, name, force = false) {
  const feature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET);
  const value = presetValue(name);
  if (!feature || value === null) {
    return false;
  }
  if (Number(feature.last_value) === value && !force) {
    // Saving an unchanged state would emit a NEW_STATE and, through it, tell
    // every open widget to redraw for nothing. `force` is the exception: when a
    // hold ends, the widgets are displaying the held preset while the stored one
    // never moved, so they need it pushed back even though nothing changed here.
    return false;
  }
  await this.gladys.device.saveState(feature, value);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
    payload: { device: device.selector, preset: name },
  });
  return true;
}

/**
 * @description Write the operating state of a virtual thermostat, so the house
 * can see whether it is heating without inferring it from a switch.
 * @param {object} device - The thermostat device.
 * @param {number} state - A THERMOSTAT_OPERATING_STATE value.
 * @returns {Promise<void>}
 * @example
 * await saveOperatingState.call(this, device, THERMOSTAT_OPERATING_STATE.HEATING);
 */
async function saveOperatingState(device, state) {
  const feature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE);
  if (!feature || Number(feature.last_value) === state) {
    return;
  }
  await this.gladys.device.saveState(feature, state);
}

/**
 * @description The manual hold armed on a thermostat, read from its params.
 * `until` is null on a permanent hold — the case of a thermostat that follows
 * no schedule, where nothing would otherwise take the setpoint back.
 * @param {object} device - The thermostat device.
 * @returns {{ setpoint: number, until: number|null }|null} The hold, or null when none is armed.
 * @example
 * getManualHold(device); // { setpoint: 21.5, until: 1700000000000 }
 */
function getManualHold(device) {
  const params = (device && device.params) || [];
  const setpointParam = params.find((param) => param.name === MANUAL_SETPOINT_PARAM);
  if (!setpointParam || setpointParam.value === '' || setpointParam.value === null) {
    return null;
  }
  const setpoint = Number(setpointParam.value);
  if (!Number.isFinite(setpoint)) {
    logger.warn(`Thermostat: ignoring a malformed manual setpoint on ${device.selector}`);
    return null;
  }
  const untilParam = params.find((param) => param.name === MANUAL_UNTIL_PARAM);
  const until = untilParam && untilParam.value ? Number(untilParam.value) : null;
  return { setpoint, until: Number.isFinite(until) ? until : null };
}

/**
 * @description Arm a manual hold on a thermostat.
 * @param {object} device - The thermostat device.
 * @param {number} setpoint - The setpoint to hold.
 * @param {number|null} until - When the hold expires, or null to hold for ever.
 * @returns {Promise<void>}
 * @example
 * await setManualHold.call(this, device, 21.5, Date.now() + 1800000);
 */
async function setManualHold(device, setpoint, until) {
  await this.gladys.device.setParam(device, MANUAL_SETPOINT_PARAM, String(setpoint));
  await this.gladys.device.setParam(device, MANUAL_UNTIL_PARAM, until === null ? '' : String(until));
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
    payload: { device: device.selector, setpoint, until },
  });
}

/**
 * @description Clear the manual hold of a thermostat, handing it back to its
 * schedule.
 * @param {object} device - The thermostat device.
 * @returns {Promise<void>}
 * @example
 * await clearManualHold.call(this, device);
 */
async function clearManualHold(device) {
  await this.gladys.device.setParam(device, MANUAL_SETPOINT_PARAM, '');
  await this.gladys.device.setParam(device, MANUAL_UNTIL_PARAM, '');
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
    payload: { device: device.selector, setpoint: null, until: null },
  });
}

/**
 * @description Tell every open dashboard that a thermostat's configuration
 * changed, so the widgets reload it from the device. The payload carries no
 * configuration: the device is the single store, and sending a copy here would
 * be a second one that could disagree with it.
 * @returns {undefined}
 * @example
 * thermostatHandler.broadcastConfigUpdated();
 */
function broadcastConfigUpdated() {
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
    payload: {},
  });
}

/**
 * @description Schedule a debounced applySchedules run, so a burst of writes
 * (a preset, then a setpoint) triggers a single regulation pass a couple of
 * seconds later instead of waiting for the next minute tick.
 * @returns {undefined}
 * @example
 * thermostatHandler.triggerApplySchedules();
 */
function triggerApplySchedules() {
  const handler = this;
  if (handler.applyTimer) {
    clearTimeout(handler.applyTimer);
  }
  handler.applyTimer = setTimeout(async () => {
    handler.applyTimer = null;
    try {
      // @ts-ignore — handler is the ThermostatHandler instance, applySchedules is on its prototype
      await handler.applySchedules();
    } catch (e) {
      logger.warn(`Thermostat: debounced applySchedules failed: ${e.message}`);
    }
  }, APPLY_DEBOUNCE_MS);
}

module.exports = {
  getFeature,
  isStopped,
  getPreset,
  savePreset,
  saveOperatingState,
  getManualHold,
  setManualHold,
  clearManualHold,
  broadcastConfigUpdated,
  triggerApplySchedules,
  presetName,
  presetValue,
  PRESETS,
  MANUAL_SETPOINT_PARAM,
  MANUAL_UNTIL_PARAM,
};
