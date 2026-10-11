const logger = require('../../utils/logger');
const { BadParameters, NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');
const {
  MAX_SCENE_EVENT_DATA_KEYS,
  MAX_SCENE_EVENT_STRING_LENGTH,
  MAX_SCENE_EVENTS_PER_MINUTE,
} = require('./constants');
const {
  getDeclaredSceneTriggers,
  getFilterType,
  coerceSceneValue,
} = require('./externalIntegration.sceneDeclarations');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * @description Check the payload of a scene event: flat, one primitive per
 * key. The event carries details, never a payload to interpret — a snapshot
 * goes through POST /camera/image, a state through POST /state.
 * @param {any} data - The published data.
 * @example
 * validateSceneEventData({ label: 'person', score: 0.92 });
 */
function validateSceneEventData(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new BadParameters('data: must be an object');
  }
  const keys = Object.keys(data);
  if (keys.length > MAX_SCENE_EVENT_DATA_KEYS) {
    throw new BadParameters(`data: max ${MAX_SCENE_EVENT_DATA_KEYS} keys per event`);
  }
  keys.forEach((key) => {
    const value = data[key];
    if (value === null || typeof value === 'boolean') {
      return;
    }
    if (typeof value === 'string') {
      if (value.length > MAX_SCENE_EVENT_STRING_LENGTH) {
        throw new BadParameters(`data.${key}: must be a string of at most ${MAX_SCENE_EVENT_STRING_LENGTH} characters`);
      }
      return;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return;
    }
    throw new BadParameters(`data.${key}: must be a string, a finite number, a boolean or null`);
  });
}

/**
 * @description Fire a scene trigger declared by the integration
 * (POST /api/integration/v1/scene/event): the core builds, from the
 * declaration, the filters the matcher reads and the data the scene actions
 * read — two whitelists, one per consumer, every other key dropped, every
 * declared key present (null when absent) — then emits the event on the
 * scene pipeline. Evaluated once, at most once, no queue: 200 means
 * "accepted and evaluated", never "a scene ran" (the integration knows
 * nothing about scenes). Rate limited on a counter separate from the states.
 * @param {object} service - The external integration service.
 * @param {object} body - The request body ({ key, data }).
 * @returns {object} The emitted event.
 * @example
 * gladys.externalIntegration.publishSceneEvent(service, { key: 'object_detected', data: { label: 'person' } });
 */
function publishSceneEvent(service, body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadParameters('body: must be an object');
  }
  const { key, data = {} } = body;
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadParameters('key: must be a non-empty string');
  }
  // the lookup is on the caller's own manifest: tenant isolation by construction
  const declaration = getDeclaredSceneTriggers(service.manifest).find((trigger) => trigger.key === key);
  if (!declaration) {
    throw new NotFoundError(`SCENE_TRIGGER_NOT_DECLARED: scene trigger ${key} is not declared in the manifest`);
  }
  validateSceneEventData(data);
  // fixed one-minute window, in memory per integration, separate from the
  // states' counter (Frigate publishes both, they never compete)
  const now = Date.now();
  let rateLimit = this.sceneEventRateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    this.sceneEventRateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count + 1 > MAX_SCENE_EVENTS_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_SCENE_EVENTS_PER_MINUTE} scene events per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
  const filters = {};
  (declaration.fields || []).forEach((field) => {
    if (field.type === 'section') {
      return;
    }
    filters[field.key] = coerceSceneValue(data[field.key], getFilterType(field));
  });
  const eventData = {};
  (declaration.variables || []).forEach((variable) => {
    eventData[variable.key] = coerceSceneValue(data[variable.key], variable.type);
  });
  const event = {
    type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
    integration: service.selector,
    trigger_key: key,
    filters,
    data: eventData,
  };
  logger.debug(`External integration ${service.selector}: scene event ${key} accepted`);
  this.event.emit(EVENTS.TRIGGERS.CHECK, event);
  return event;
}

module.exports = {
  publishSceneEvent,
};
