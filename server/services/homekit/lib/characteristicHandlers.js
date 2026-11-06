const logger = require('../../../utils/logger');

/**
 * @description Answer a failed HomeKit request instead of leaving the HAP callback pending.
 * @param {Function} handler - Existing GET or SET handler.
 * @param {number} [callbackIndex] - Callback position: zero for GET, one for SET.
 * @returns {Function} Handler that catches synchronous errors and rejected promises.
 * @example
 * characteristic.on(GET, handleRequest(async (callback) => callback(undefined, readValue())));
 */
function handleRequest(handler, callbackIndex = 0) {
  return async (...args) => {
    const callback = args[callbackIndex];
    let answered = false;
    const respond = (...response) => {
      if (!answered) {
        answered = true;
        callback(...response);
      }
    };
    args[callbackIndex] = respond;

    try {
      await handler(...args);
    } catch (error) {
      logger.warn(`HomeKit: characteristic request failed: ${error.message}`);
      respond(error);
    }
  };
}

/**
 * @description Read a feature value or report the missing selector without inventing a device state.
 * @param {object} stateManager - Gladys state manager.
 * @param {object} feature - Feature bound to a HomeKit characteristic.
 * @returns {number|null} The last value stored in memory.
 * @example
 * readFeatureValue(gladys.stateManager, feature);
 */
function readFeatureValue(stateManager, feature) {
  const state = stateManager.get('deviceFeature', feature.selector);
  if (!state) {
    throw new Error(`HomeKit: device feature "${feature.selector}" (${feature.name}) is missing from memory`);
  }
  return state.last_value;
}

module.exports = {
  handleRequest,
  readFeatureValue,
};
