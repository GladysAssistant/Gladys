const logger = require('../../utils/logger');
const { NotFoundError, TooManyRequests, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error400, Error503, Error504 } = require('../../utils/httpErrors');
const {
  WEBSOCKET_MESSAGE_TYPES,
  ERROR_MESSAGES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  MUSIC_ARTWORK_KEY_REGEX,
} = require('../../utils/constants');
const {
  MUSIC_COMMAND_TIMEOUT_MS,
  MAX_MUSIC_COMMANDS_IN_FLIGHT,
  MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION,
  MUSIC_ARTWORK_KEY_TTL_MS,
  WIDGET_GET_TIMEOUT_MS,
  WIDGET_IMAGE_CACHE_TTL_MS,
  MAX_WIDGET_IMAGE_CACHE_ENTRIES,
  MAX_WIDGET_IMAGE_IN_FLIGHT,
  MAX_WIDGET_MESSAGE_LENGTH,
} = require('./constants');
const { normalizeWidgetImage, WIDGET_IMAGE_ERROR_CODES } = require('./externalIntegration.normalizeWidgetImage');
const {
  WIDGET_IMAGE_GENERATION_KEY,
  getServiceMap,
  lruGet,
  lruSet,
  acquireSlot,
} = require('./externalIntegration.widgetCache');

// The core's own failure codes of a music command: they never carry an
// integration-authored message
const NOT_CONNECTED = 'EXTERNAL_INTEGRATION_NOT_CONNECTED';
const COMMAND_TIMEOUT = 'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT';
const CORE_ERROR_CODES = [
  NOT_CONNECTED,
  COMMAND_TIMEOUT,
  'EXTERNAL_INTEGRATION_COMMAND_FAILED',
  ...WIDGET_IMAGE_ERROR_CODES,
];

/**
 * @description Translate a music command failure into its HTTP error
 * (capabilities/music.md, section 4.3): integration not connected → 503,
 * ack timeout → 504, a refusal or an invalid payload → 400
 * REQUEST_TO_THIRD_PARTY_FAILED carrying the integration's own `error`
 * (bounded, rendered escaped) or the core's image refusal detail. Anything
 * else is returned unchanged.
 * @param {Error} error - The error thrown by the command path.
 * @returns {Error} The error to throw.
 * @example
 * throw toMusicHttpError(e);
 */
function toMusicHttpError(error) {
  if (!(error instanceof ExternalIntegrationUnavailableError)) {
    return error;
  }
  if (error.message === NOT_CONNECTED) {
    return new Error503('EXTERNAL_INTEGRATION_UNAVAILABLE');
  }
  if (error.message === COMMAND_TIMEOUT) {
    return new Error504('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
  }
  const httpError = new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
  if (WIDGET_IMAGE_ERROR_CODES.includes(error.message)) {
    httpError.error = `${error.message}: ${error.details}`;
  } else if (!CORE_ERROR_CODES.includes(error.message)) {
    httpError.error = `${error.message}`.slice(0, MAX_WIDGET_MESSAGE_LENGTH);
  }
  return httpError;
}

/**
 * @description Relay one music command to an integration: at most
 * MAX_MUSIC_COMMANDS_IN_FLIGHT per integration (429 beyond, the request never
 * queues until the deadline), 10 s ack. Failures come back as HTTP errors
 * (toMusicHttpError).
 * @param {object} service - The external integration service.
 * @param {string} type - The WebSocket message type.
 * @param {object} payload - The command payload.
 * @returns {Promise<object>} Resolve with the command-result `data`.
 * @example
 * const data = await gladys.externalIntegration.relayMusicCommand(service, 'external-integration.music.search', {...});
 */
async function relayMusicCommand(service, type, payload) {
  const inFlight = this.musicCommandsInFlight.get(service.id) || 0;
  if (inFlight >= MAX_MUSIC_COMMANDS_IN_FLIGHT) {
    throw new TooManyRequests('EXTERNAL_INTEGRATION_MUSIC_TOO_MANY_REQUESTS', 1);
  }
  this.musicCommandsInFlight.set(service.id, inFlight + 1);
  try {
    const result = await this.sendCommand(service, type, payload, { timeoutMs: MUSIC_COMMAND_TIMEOUT_MS });
    return (result && result.data) || {};
  } catch (e) {
    throw toMusicHttpError(e);
  } finally {
    this.musicCommandsInFlight.set(service.id, (this.musicCommandsInFlight.get(service.id) || 1) - 1);
  }
}

/**
 * @description Remember the artwork keys of a music response: a key seen in a
 * browse, search or queue answer stays servable by the artwork route for the
 * image cache TTL (capabilities/music.md, section 3), ≤ 1000 keys per
 * integration in LRU order.
 * @param {object} service - The external integration service.
 * @param {Array<object>} items - The normalized MediaItems.
 * @example
 * gladys.externalIntegration.rememberMusicArtworkKeys(service, items);
 */
function rememberMusicArtworkKeys(service, items) {
  const keys = getServiceMap(this.musicArtworkKeys, service.id);
  const expiresAt = Date.now() + MUSIC_ARTWORK_KEY_TTL_MS;
  items.forEach((item) => {
    if (item.artwork_key) {
      lruSet(keys, item.artwork_key, expiresAt, MAX_MUSIC_ARTWORK_KEYS_PER_INTEGRATION);
    }
  });
}

/**
 * @description Tell whether an artwork key may be served for a device of an
 * integration: the device's current `artwork` state, or a key seen in a music
 * response of the last hour. Anything else 404s without a byte sent.
 * @param {object} service - The external integration service.
 * @param {object} device - The player (from the stateManager, with its features).
 * @param {string} key - The artwork key.
 * @returns {boolean} True when the key is allowlisted.
 * @example
 * isMusicArtworkKeyAllowed(service, device, 'art-3f9a2c1b7e4d');
 */
function isMusicArtworkKeyAllowed(service, device, key) {
  const isCurrentArtwork = (device.features || []).some(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.MUSIC &&
      feature.type === DEVICE_FEATURE_TYPES.MUSIC.ARTWORK &&
      feature.last_value_string === key,
  );
  if (isCurrentArtwork) {
    return true;
  }
  const keys = this.musicArtworkKeys.get(service.id);
  const expiresAt = keys ? keys.get(key) : undefined;
  return expiresAt !== undefined && expiresAt > Date.now();
}

/**
 * @description Pull one artwork over music.get-artwork (15 s ack, the queued
 * image pool shared with widget images), validate the bytes exactly like a
 * widget image and cache the data URI an hour under the image generation
 * stamped at the start.
 * @param {object} supervisor - The external integration manager.
 * @param {object} service - The external integration service.
 * @param {string} key - The artwork key.
 * @returns {Promise<string>} Resolve with the image as a data URI.
 * @example
 * const image = await pullMusicArtwork(this, service, 'art-3f9a2c1b7e4d');
 */
async function pullMusicArtwork(supervisor, service, key) {
  const generation = supervisor.getWidgetGeneration(service.id, WIDGET_IMAGE_GENERATION_KEY);
  const release = await acquireSlot(supervisor.widgetImageSlots, service.id, MAX_WIDGET_IMAGE_IN_FLIGHT);
  try {
    const result = await supervisor.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MUSIC_GET_ARTWORK,
      { key },
      { timeoutMs: WIDGET_GET_TIMEOUT_MS },
    );
    const image = normalizeWidgetImage(result && result.data && result.data.image);
    if (generation === supervisor.getWidgetGeneration(service.id, WIDGET_IMAGE_GENERATION_KEY)) {
      lruSet(
        getServiceMap(supervisor.widgetImageCache, service.id),
        key,
        { image, expiresAt: Date.now() + WIDGET_IMAGE_CACHE_TTL_MS },
        MAX_WIDGET_IMAGE_CACHE_ENTRIES,
      );
    }
    return image;
  } catch (e) {
    if (WIDGET_IMAGE_ERROR_CODES.includes(e.message)) {
      logger.warn(`Music artwork ${service.selector}/${key} refused: ${e.message} (${e.details})`);
    }
    throw toMusicHttpError(e);
  } finally {
    release();
  }
}

/**
 * @description Serve the artwork of a player (capabilities/music.md, section
 * 3): key shape-checked, allowlisted (the device's current artwork state or a
 * key seen in a music response of the last hour), served from the shared
 * image cache whatever the state of the container, pulled from the
 * integration otherwise (503 when it is not connected); concurrent requests
 * for one key share one command.
 * @param {object} service - The external integration service.
 * @param {object} device - The player (from the stateManager).
 * @param {string} key - The artwork key.
 * @returns {Promise<string>} Resolve with the image as a data URI.
 * @example
 * const image = await gladys.externalIntegration.getMusicArtwork(service, device, 'art-3f9a2c1b7e4d');
 */
async function getMusicArtwork(service, device, key) {
  if (typeof key !== 'string' || !MUSIC_ARTWORK_KEY_REGEX.test(key)) {
    throw new NotFoundError('MUSIC_ARTWORK_NOT_FOUND');
  }
  if (!this.isMusicArtworkKeyAllowed(service, device, key)) {
    throw new NotFoundError('MUSIC_ARTWORK_NOT_FOUND');
  }
  const cached = lruGet(getServiceMap(this.widgetImageCache, service.id), key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.image;
  }
  const inFlight = getServiceMap(this.widgetImageInFlight, service.id);
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }
  const promise = pullMusicArtwork(this, service, key).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

module.exports = {
  toMusicHttpError,
  relayMusicCommand,
  rememberMusicArtworkKeys,
  isMusicArtworkKeyAllowed,
  getMusicArtwork,
};
