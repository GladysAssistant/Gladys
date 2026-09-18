const { NotFoundError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  WIDGET_GET_TIMEOUT_MS,
  WIDGET_IMAGE_KEY_REGEX,
  WIDGET_IMAGE_CACHE_TTL_MS,
  MAX_WIDGET_IMAGE_CACHE_ENTRIES,
  MAX_WIDGET_IMAGE_IN_FLIGHT,
} = require('./constants');
const { normalizeWidgetImage } = require('./externalIntegration.normalizeWidgetImage');
const { getServiceMap, lruGet, lruSet, acquireSlot } = require('./externalIntegration.widgetCache');
const { toWidgetHttpError } = require('./externalIntegration.widgetErrors');

/**
 * @description Pull one image from the integration over widget.get-image
 * (15 s ack, at most 4 image commands in flight per integration, the others
 * queued), validate the bytes and cache the data URI for an hour.
 * @param {object} supervisor - The external integration manager.
 * @param {object} service - The external integration service.
 * @param {string} imageKey - The declared image key.
 * @returns {Promise<string>} Resolve with the image as a data URI.
 * @example
 * const image = await pullWidgetImage(this, service, 'poster-20637522');
 */
async function pullWidgetImage(supervisor, service, imageKey) {
  const release = await acquireSlot(supervisor.widgetImageSlots, service.id, MAX_WIDGET_IMAGE_IN_FLIGHT);
  try {
    const result = await supervisor.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET_IMAGE,
      { image_key: imageKey },
      { timeoutMs: WIDGET_GET_TIMEOUT_MS },
    );
    const image = normalizeWidgetImage(result && result.data && result.data.image);
    lruSet(
      getServiceMap(supervisor.widgetImageCache, service.id),
      imageKey,
      { image, expiresAt: Date.now() + WIDGET_IMAGE_CACHE_TTL_MS },
      MAX_WIDGET_IMAGE_CACHE_ENTRIES,
    );
    return image;
  } catch (e) {
    throw toWidgetHttpError(e);
  } finally {
    release();
  }
}

/**
 * @description Serve an image declared by a widget content of an
 * integration (section 6 of capabilities/dashboard-widgets.md). Image keys
 * are integration-scoped: the allowlist is the union of the keys declared in
 * the integration's currently cached contents — a key declared nowhere 404s
 * without a single byte sent to the integration, and the key is shape-checked
 * before anything is looked up. Validated images (PNG/JPEG/WebP, ≤ 300 KB) are
 * served from the Gladys origin and cached 1 h; concurrent requests for one
 * key share one command.
 * @param {string} selector - The selector of the external integration.
 * @param {string} imageKey - The image key.
 * @returns {Promise<string>} Resolve with the image as a data URI.
 * @example
 * const image = await gladys.externalIntegration.getWidgetImage('ext-tmdb', 'poster-20637522');
 */
async function getWidgetImage(selector, imageKey) {
  if (typeof imageKey !== 'string' || !WIDGET_IMAGE_KEY_REGEX.test(imageKey)) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_WIDGET_IMAGE_NOT_DECLARED');
  }
  const service = await this.getBySelector(selector);
  const contents = this.widgetContentCache.get(service.id);
  const declared = contents && [...contents.values()].some((entry) => entry.imageKeys.includes(imageKey));
  if (!declared) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_WIDGET_IMAGE_NOT_DECLARED');
  }
  const cached = lruGet(getServiceMap(this.widgetImageCache, service.id), imageKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.image;
  }
  const inFlight = getServiceMap(this.widgetImageInFlight, service.id);
  if (inFlight.has(imageKey)) {
    return inFlight.get(imageKey);
  }
  const promise = pullWidgetImage(this, service, imageKey).finally(() => {
    inFlight.delete(imageKey);
  });
  inFlight.set(imageKey, promise);
  return promise;
}

module.exports = {
  getWidgetImage,
};
