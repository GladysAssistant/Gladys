const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const APPLY_DEBOUNCE_MS = 2000;

// Per-thermostat runtime state, keyed THERMOSTAT_<FEATURE>_<SUFFIX>. The
// configuration is not in this list on purpose: it lives on the device, and
// letting a client write it back here would recreate a second source of truth.
const RUNTIME_SUFFIXES = ['PRESET', 'PRESET_FALLBACK', 'MANUAL_MODE', 'MANUAL_UNTIL', 'MANUAL_SETPOINT'];

/**
 * @description Whether a variable key has the shape of a thermostat runtime key.
 * This only checks the prefix and the suffix; whether the middle segment names a
 * feature this service actually owns is settled by `resolveRuntimeVariableKey`.
 * @param {string} variableKey - Variable key to check.
 * @returns {boolean} True when the key is a known runtime key.
 * @example
 * isRuntimeVariableKey('THERMOSTAT_LIVING_ROOM_PRESET'); // true
 */
function isRuntimeVariableKey(variableKey) {
  if (!variableKey || !variableKey.startsWith('THERMOSTAT_')) {
    return false;
  }
  return RUNTIME_SUFFIXES.some((suffix) => variableKey.endsWith(`_${suffix}`));
}

/**
 * @description Turn a feature selector into the middle segment of its runtime keys.
 * @param {string} selector - Device feature selector.
 * @returns {string} The upper-cased, underscore-separated segment.
 * @example
 * featureKeyFromSelector('living-room-thermostat'); // 'LIVING_ROOM_THERMOSTAT'
 */
function featureKeyFromSelector(selector) {
  return selector.toUpperCase().replace(/-/g, '_');
}

/**
 * @description The runtime feature keys owned by this service, as the middle
 * segment of their variable keys. Every getVariable/setVariable call has to
 * check ownership, and a widget fires four or five of them on mount: without
 * this cache each one is a device query. Dropped by `invalidateDeviceCaches`
 * whenever a thermostat is created, updated or deleted.
 * @returns {Promise<Set<string>>} Owned feature keys.
 * @example
 * const keys = await thermostatHandler.getFeatureKeys();
 */
async function getFeatureKeys() {
  if (this.featureKeysCache) {
    return this.featureKeysCache;
  }
  const devices = await this.gladys.device.get({ service: 'thermostat' });
  const featureKeys = new Set();
  (devices || []).forEach((device) => {
    (device.features || []).forEach((feature) => {
      featureKeys.add(featureKeyFromSelector(feature.selector));
    });
    // An external thermostat owns no feature: its runtime state is keyed on the
    // real device's setpoint feature, which the user named in the integration
    // page. Without this the preset and the manual hold of every external
    // thermostat would be refused as "not owned by this service".
    const targetParam = (device.params || []).find((param) => param.name === 'THERMOSTAT_TARGET_FEATURE');
    if (targetParam && targetParam.value) {
      featureKeys.add(featureKeyFromSelector(targetParam.value));
    }
  });
  this.featureKeysCache = featureKeys;
  return featureKeys;
}

/**
 * @description Check that a runtime key names a feature owned by this service.
 * The prefix and suffix alone are not enough: THERMOSTAT_ANYTHING_PRESET would
 * pass, create a row for a feature that does not exist, and stay there forever —
 * `postDelete` only cleans up the keys derived from a deleted device's features.
 * @param {string} variableKey - Variable key, THERMOSTAT_<FEATURE>_<RUNTIME_SUFFIX>.
 * @returns {Promise<boolean>} True when the key belongs to one of this service's features.
 * @example
 * await thermostatHandler.resolveRuntimeVariableKey('THERMOSTAT_LIVING_ROOM_PRESET');
 */
async function resolveRuntimeVariableKey(variableKey) {
  if (!isRuntimeVariableKey(variableKey)) {
    return false;
  }
  const suffix = RUNTIME_SUFFIXES.find((candidate) => variableKey.endsWith(`_${candidate}`));
  const featureKey = variableKey.slice('THERMOSTAT_'.length, variableKey.length - `_${suffix}`.length);
  if (featureKey.length === 0) {
    return false;
  }
  const featureKeys = await getFeatureKeys.call(this);
  return featureKeys.has(featureKey);
}

/**
 * @description Set a thermostat runtime variable, broadcast the matching websocket
 * message so every open dashboard refreshes, and schedule a debounced regulation pass.
 * Only the runtime keys are accepted: the configuration lives on the device.
 * @param {string} variableKey - Variable key, THERMOSTAT_<FEATURE>_<RUNTIME_SUFFIX>.
 * @param {string} value - Variable value.
 * @returns {Promise<object>} The saved variable.
 * @example
 * await thermostatHandler.setVariable('THERMOSTAT_MY_DEVICE_PRESET', 'comfort');
 */
async function setVariable(variableKey, value) {
  const owned = await this.resolveRuntimeVariableKey(variableKey);
  if (!owned) {
    throw new Error(`Invalid thermostat variable key: ${variableKey}`);
  }
  // Scoped to this service: unscoped rows sit in the global variable table and
  // postDelete would have to guess their names to clean them up.
  const variable = await this.gladys.variable.setValue(variableKey, value, this.serviceId);

  let messageType = null;
  if (variableKey.endsWith('_PRESET')) {
    messageType = WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED;
  } else if (variableKey.endsWith('_MANUAL_MODE')) {
    messageType = WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED;
  }
  if (messageType) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: messageType,
      payload: { key: variableKey, value },
    });
  }

  this.triggerApplySchedules();
  return variable;
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
 * @description Read a thermostat runtime variable in this service's scope.
 * @param {string} variableKey - Variable key.
 * @returns {Promise<string|null>} The stored value, or null.
 * @example
 * await thermostatHandler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');
 */
async function getVariable(variableKey) {
  const owned = await this.resolveRuntimeVariableKey(variableKey);
  if (!owned) {
    return null;
  }
  return this.gladys.variable.getValue(variableKey, this.serviceId);
}

/**
 * @description Schedule a debounced applySchedules run, so a burst of variable
 * writes (preset + manual mode + manual setpoint) triggers a single regulation
 * pass a couple of seconds later instead of waiting for the next minute tick.
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
  setVariable,
  getVariable,
  getFeatureKeys,
  resolveRuntimeVariableKey,
  broadcastConfigUpdated,
  triggerApplySchedules,
  isRuntimeVariableKey,
  RUNTIME_SUFFIXES,
};
