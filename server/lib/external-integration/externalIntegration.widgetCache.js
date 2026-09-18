const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

// In-memory state of the integration dashboard widgets (section 3 of
// capabilities/dashboard-widgets.md): per-integration content and image
// caches in LRU order, generation counters per (integration, widget key),
// in-flight command coalescing and the per-integration pull bounds. Every
// map is keyed by service id and dropped in full when the integration stops,
// updates or is uninstalled.

/**
 * @description Get (creating it when absent) the per-integration Map of a
 * Map-of-Maps state.
 * @param {Map} state - The service id → Map state.
 * @param {string} serviceId - The integration service id.
 * @returns {Map} The per-integration Map.
 * @example
 * const cache = getServiceMap(this.widgetContentCache, service.id);
 */
function getServiceMap(state, serviceId) {
  if (!state.has(serviceId)) {
    state.set(serviceId, new Map());
  }
  return state.get(serviceId);
}

/**
 * @description Read an entry of an LRU Map, refreshing its position.
 * @param {Map} map - The LRU Map (insertion order = age).
 * @param {string} key - The entry key.
 * @returns {any} The entry, or undefined.
 * @example
 * const entry = lruGet(cache, cacheKey);
 */
function lruGet(map, key) {
  if (!map.has(key)) {
    return undefined;
  }
  const value = map.get(key);
  map.delete(key);
  map.set(key, value);
  return value;
}

/**
 * @description Write an entry of an LRU Map, evicting the oldest entries
 * beyond the capacity.
 * @param {Map} map - The LRU Map.
 * @param {string} key - The entry key.
 * @param {any} value - The entry.
 * @param {number} maxEntries - The capacity.
 * @example
 * lruSet(cache, cacheKey, entry, 50);
 */
function lruSet(map, key, value, maxEntries) {
  map.delete(key);
  map.set(key, value);
  while (map.size > maxEntries) {
    map.delete(map.keys().next().value);
  }
}

/**
 * @description Acquire a slot of a per-integration concurrency limit: the
 * returned promise resolves with a release function once fewer than `max`
 * holders are active, callers beyond queue in order.
 * @param {Map} limits - The service id → { active, queue } state.
 * @param {string} serviceId - The integration service id.
 * @param {number} max - The maximum number of concurrent holders.
 * @returns {Promise<Function>} Resolve with the release function.
 * @example
 * const release = await acquireSlot(this.widgetPullSlots, service.id, 2);
 */
function acquireSlot(limits, serviceId, max) {
  if (!limits.has(serviceId)) {
    limits.set(serviceId, { active: 0, queue: [] });
  }
  const limit = limits.get(serviceId);
  const release = () => {
    const next = limit.queue.shift();
    if (next) {
      // the slot passes straight to the next waiter
      next();
    } else {
      limit.active -= 1;
    }
  };
  if (limit.active < max) {
    limit.active += 1;
    return Promise.resolve(release);
  }
  return new Promise((resolve) => {
    limit.queue.push(() => resolve(release));
  });
}

/**
 * @description Count one event of a per-integration sliding one-minute
 * window; true when the count is still within the bound.
 * @param {Map} limits - The service id → { count, resetAt } state.
 * @param {string} serviceId - The integration service id.
 * @param {number} max - The maximum count per minute.
 * @returns {boolean} True when accepted, false beyond the bound.
 * @example
 * if (!countPerMinute(this.widgetPullRates, service.id, 30)) { throw new TooManyRequests(...); }
 */
function countPerMinute(limits, serviceId, max) {
  const now = Date.now();
  const limit = limits.get(serviceId);
  if (!limit || limit.resetAt <= now) {
    limits.set(serviceId, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  limit.count += 1;
  return limit.count <= max;
}

/**
 * @description Generation key of a (integration, widget key) pair.
 * @param {string} serviceId - The integration service id.
 * @param {string} widgetKey - The widget key.
 * @returns {string} The key.
 * @example
 * const key = generationKey(service.id, 'battery');
 */
function generationKey(serviceId, widgetKey) {
  return `${serviceId}:${widgetKey}`;
}

/**
 * @description Current generation of a (integration, widget key) pair: a
 * widget.get command is stamped with it at its start, and its result is
 * only cached when the generation has not moved since.
 * @param {string} serviceId - The integration service id.
 * @param {string} widgetKey - The widget key.
 * @returns {number} The generation.
 * @example
 * const generation = gladys.externalIntegration.getWidgetGeneration(service.id, 'battery');
 */
function getWidgetGeneration(serviceId, widgetKey) {
  return this.widgetGenerations.get(generationKey(serviceId, widgetKey)) || 0;
}

/**
 * @description Invalidate the cached contents of one widget of an
 * integration (every settings / language / units variant): the generation
 * moves, so an in-flight result of the previous generation is served to the
 * callers already waiting on it but never cached, and later requests start a
 * new command. Optionally tells every open dashboard to refetch
 * (`widget-updated` on the user WebSocket).
 * @param {object} service - The external integration service.
 * @param {string} widgetKey - The widget key.
 * @param {object} [options] - Options.
 * @param {boolean} [options.broadcast] - True to broadcast widget-updated.
 * @example
 * gladys.externalIntegration.invalidateWidgetContent(service, 'battery', { broadcast: true });
 */
function invalidateWidgetContent(service, widgetKey, { broadcast = false } = {}) {
  const key = generationKey(service.id, widgetKey);
  this.widgetGenerations.set(key, (this.widgetGenerations.get(key) || 0) + 1);
  const cache = this.widgetContentCache.get(service.id);
  if (cache) {
    [...cache.entries()]
      .filter(([, entry]) => entry.widgetKey === widgetKey)
      .forEach(([cacheKey]) => cache.delete(cacheKey));
  }
  if (broadcast) {
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WIDGET_UPDATED,
      payload: { selector: service.selector, key: widgetKey },
    });
  }
}

/**
 * @description Drop every widget cache and counter of an integration: the
 * contents, the images, the generations (an in-flight command stamped with
 * a generation that no longer exists never writes to the cache), the pull
 * and action counters and the nudge timestamps. Called when the integration
 * stops, updates or is uninstalled.
 * @param {object} service - The external integration service.
 * @example
 * gladys.externalIntegration.clearWidgetCaches(service);
 */
function clearWidgetCaches(service) {
  const prefix = `${service.id}:`;
  // the generation of every widget MOVES instead of resetting: a widget.get
  // that started before the stop carries the previous stamp and is never
  // cached when it lands, and a request arriving after the restart never
  // coalesces onto it (the in-flight maps are dropped too)
  const widgetKeys = new Set([
    ...((service.manifest && service.manifest.widgets) || []).map((widget) => widget.key),
    ...[...this.widgetGenerations.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length)),
  ]);
  widgetKeys.forEach((widgetKey) => this.invalidateWidgetContent(service, widgetKey));
  [
    this.widgetContentCache,
    this.widgetInFlight,
    this.widgetPullSlots,
    this.widgetPullRates,
    this.widgetImageCache,
    this.widgetImageInFlight,
    this.widgetImageSlots,
    this.widgetActionRates,
  ].forEach((state) => state.delete(service.id));
  [...this.widgetRefreshTimes.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => this.widgetRefreshTimes.delete(key));
}

module.exports = {
  getServiceMap,
  lruGet,
  lruSet,
  acquireSlot,
  countPerMinute,
  getWidgetGeneration,
  invalidateWidgetContent,
  clearWidgetCaches,
};
