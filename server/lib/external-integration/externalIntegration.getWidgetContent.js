const { NotFoundError, TooManyRequests } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  WIDGET_GET_TIMEOUT_MS,
  MAX_WIDGET_CONTENT_CACHE_ENTRIES,
  MAX_WIDGET_GET_IN_FLIGHT,
  MAX_WIDGET_GET_MISSES_PER_MINUTE,
} = require('./constants');
const { normalizeWidgetContent, collectImageKeys } = require('./externalIntegration.normalizeWidgetContent');
const { resolveWidgetDeviceReferences } = require('./externalIntegration.resolveWidgetDeviceReferences');
const {
  validateWidgetSettings,
  findDeclaredWidget,
  canonicalJson,
} = require('./externalIntegration.validateWidgetSettings');
const { getServiceMap, lruGet, lruSet, acquireSlot, countPerMinute } = require('./externalIntegration.widgetCache');
const { toWidgetHttpError } = require('./externalIntegration.widgetErrors');

/**
 * @description The response of the content route: the absolute expiry and
 * the normalized content, never the raw payload.
 * @param {object} entry - The cache entry.
 * @returns {object} { expires_at, content: { version, components } }.
 * @example
 * res.json(formatEntry(entry));
 */
function formatEntry(entry) {
  return {
    expires_at: new Date(entry.expiresAt).toISOString(),
    content: { version: entry.version, components: entry.components },
  };
}

/**
 * @description Pull the content of one widget instance from the integration
 * (a cache miss): bounded (30 misses per minute per integration → 429, at
 * most 2 commands in flight per integration, further misses queue), relayed
 * over widget.get with a 15 s ack, normalized and bounded, device references
 * resolved within the tenant, then cached under the generation stamped at the
 * start — a result arriving under a newer generation (a nudge landed
 * meanwhile) is served to its waiting callers but never cached.
 * @param {object} supervisor - The external integration manager.
 * @param {object} context - The pull context: service, widget, settings, language, units, cacheKey, generation.
 * @returns {Promise<object>} Resolve with the cache entry.
 * @example
 * const entry = await pullWidgetContent(this, context);
 */
async function pullWidgetContent(supervisor, context) {
  const { service, widget, settings, language, units, cacheKey, generation } = context;
  if (!countPerMinute(supervisor.widgetPullRates, service.id, MAX_WIDGET_GET_MISSES_PER_MINUTE)) {
    throw new TooManyRequests('EXTERNAL_INTEGRATION_WIDGET_PULL_RATE_LIMITED', 60);
  }
  const release = await acquireSlot(supervisor.widgetPullSlots, service.id, MAX_WIDGET_GET_IN_FLIGHT);
  let normalized;
  try {
    const result = await supervisor.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_GET,
      { key: widget.key, settings, language, units },
      { timeoutMs: WIDGET_GET_TIMEOUT_MS },
    );
    const payload = result && result.data && result.data.content;
    normalized = normalizeWidgetContent(payload, `${service.selector}/${widget.key}`);
  } catch (e) {
    throw toWidgetHttpError(e);
  } finally {
    release();
  }
  const components = await resolveWidgetDeviceReferences(service, normalized.components);
  const entry = {
    widgetKey: widget.key,
    version: normalized.version,
    components,
    imageKeys: collectImageKeys(components),
    expiresAt: Date.now() + normalized.ttl_seconds * 1000,
  };
  if (supervisor.getWidgetGeneration(service.id, widget.key) === generation) {
    lruSet(getServiceMap(supervisor.widgetContentCache, service.id), cacheKey, entry, MAX_WIDGET_CONTENT_CACHE_ENTRIES);
  }
  return entry;
}

/**
 * @description Get the content of one widget instance (section 3 of
 * capabilities/dashboard-widgets.md): resolve the integration and the
 * declared widget (404 otherwise), validate the instance settings (422
 * naming the key), then serve the content cache keyed by (integration,
 * widget, canonical settings, language, units) — concurrent misses for one
 * key share one command, a request arriving after an invalidation never
 * coalesces onto a stale in-flight command.
 * @param {string} selector - The selector of the external integration.
 * @param {string} widgetKey - The declared widget key.
 * @param {object} [rawSettings] - The settings of the box instance.
 * @param {object} options - The requesting user's preferences (from the session, never the query).
 * @param {string} options.language - ISO 639-1 language.
 * @param {string} options.units - 'metric' or 'us'.
 * @returns {Promise<object>} Resolve with { expires_at, content }.
 * @example
 * const preferences = { language: 'fr', units: 'metric' };
 * const content = await gladys.externalIntegration.getWidgetContent('ext-tmdb', 'upcoming_releases', {}, preferences);
 */
async function getWidgetContent(selector, widgetKey, rawSettings, { language, units }) {
  const service = await this.getBySelector(selector);
  const widget = findDeclaredWidget(service, widgetKey);
  if (!widget) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_WIDGET_NOT_FOUND');
  }
  const settings = await validateWidgetSettings(service, widget, rawSettings);
  const cacheKey = `${widgetKey}:${canonicalJson(settings)}:${language}:${units}`;
  const cache = getServiceMap(this.widgetContentCache, service.id);
  const cached = lruGet(cache, cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return formatEntry(cached);
  }
  const inFlight = getServiceMap(this.widgetInFlight, service.id);
  const generation = this.getWidgetGeneration(service.id, widgetKey);
  const existing = inFlight.get(cacheKey);
  if (existing && existing.generation === generation) {
    // coalescing: ten open tablets never mean ten commands
    return formatEntry(await existing.promise);
  }
  const pending = { generation };
  pending.promise = pullWidgetContent(this, {
    service,
    widget,
    settings,
    language,
    units,
    cacheKey,
    generation,
  }).finally(() => {
    if (inFlight.get(cacheKey) === pending) {
      inFlight.delete(cacheKey);
    }
  });
  inFlight.set(cacheKey, pending);
  return formatEntry(await pending.promise);
}

module.exports = {
  getWidgetContent,
};
