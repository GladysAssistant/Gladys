const { BadParameters, TooManyRequests } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const { MAX_STATES_PER_REQUEST, MAX_STATES_PER_MINUTE } = require('./constants');

/**
 * @description Save a batch of device states published by an integration.
 * Mapped on EVENTS.DEVICE.NEW_STATE (the path used by native services): an
 * unknown device_feature_external_id is silently ignored (the user has not
 * created this device). Rate limited to 300 states/minute per integration.
 * @param {object} service - The external integration service.
 * @param {Array} states - The batch of states.
 * @returns {number} The number of states forwarded.
 * @example
 * gladys.externalIntegration.saveStates(service, [{ device_feature_external_id: 'ext:x:y', state: 12 }]);
 */
function saveStates(service, states) {
  if (!Array.isArray(states)) {
    throw new BadParameters('states: must be an array');
  }
  if (states.length > MAX_STATES_PER_REQUEST) {
    throw new BadParameters(`states: max ${MAX_STATES_PER_REQUEST} states per request`);
  }
  // sliding one-minute window rate limit, in memory per integration
  const now = Date.now();
  let rateLimit = this.stateRateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    this.stateRateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count + states.length > MAX_STATES_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_STATES_PER_MINUTE} states per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += states.length;
  const externalIdPrefix = `ext:${service.selector}:`;
  states.forEach((state, index) => {
    if (state === null || typeof state !== 'object') {
      throw new BadParameters(`states[${index}]: must be an object`);
    }
    if (
      typeof state.device_feature_external_id !== 'string' ||
      !state.device_feature_external_id.startsWith(externalIdPrefix)
    ) {
      throw new BadParameters(`states[${index}].device_feature_external_id: must start with "${externalIdPrefix}"`);
    }
    const hasNumericState = typeof state.state === 'number' && Number.isFinite(state.state);
    const hasText = typeof state.text === 'string';
    if (!hasNumericState && !hasText) {
      throw new BadParameters(`states[${index}]: must have a numeric "state" or a string "text"`);
    }
    if (state.created_at !== undefined && Number.isNaN(Date.parse(state.created_at))) {
      throw new BadParameters(`states[${index}].created_at: must be an ISO 8601 date`);
    }
  });
  states.forEach((state) => {
    const event = {
      device_feature_external_id: state.device_feature_external_id,
    };
    if (typeof state.state === 'number') {
      event.state = state.state;
    }
    if (typeof state.text === 'string') {
      event.text = state.text;
    }
    if (state.created_at !== undefined) {
      event.created_at = state.created_at;
    }
    this.event.emit(EVENTS.DEVICE.NEW_STATE, event);
  });
  return states.length;
}

module.exports = {
  saveStates,
};
