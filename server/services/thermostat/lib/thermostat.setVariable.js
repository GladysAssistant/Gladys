const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const APPLY_DEBOUNCE_MS = 2000;

// Per-thermostat runtime state, keyed THERMOSTAT_<FEATURE>_<SUFFIX>. The
// configuration is not in this list on purpose: it lives on the device, and
// letting a client write it back here would recreate a second source of truth.
const RUNTIME_SUFFIXES = ['PRESET', 'PRESET_FALLBACK', 'MANUAL_MODE', 'MANUAL_UNTIL', 'MANUAL_SETPOINT'];

/**
 * @description Whether a variable key is a thermostat runtime key this service owns.
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
  if (!isRuntimeVariableKey(variableKey)) {
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
  if (!isRuntimeVariableKey(variableKey)) {
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
  broadcastConfigUpdated,
  triggerApplySchedules,
  isRuntimeVariableKey,
  RUNTIME_SUFFIXES,
};
