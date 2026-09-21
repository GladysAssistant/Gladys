// The declared widgets of every installed integration, as the box picker
// and every widget card need them (label, icon, settings, integration
// status). A dashboard holds several widget cards mounting at once: one
// request serves them all for a few seconds instead of one request per card.
const LIST_CACHE_TTL_MS = 5 * 1000;

let cachedPromise = null;
let cachedAt = 0;

export const loadWidgetList = httpClient => {
  const now = Date.now();
  if (!cachedPromise || now - cachedAt > LIST_CACHE_TTL_MS) {
    cachedAt = now;
    const promise = httpClient.get('/api/v1/external_integration/widget').catch(e => {
      // a failed list is not kept: the next card retries — unless a newer
      // request already replaced it, which stays shared
      if (cachedPromise === promise) {
        cachedPromise = null;
      }
      throw e;
    });
    cachedPromise = promise;
  }
  return cachedPromise;
};

export const invalidateWidgetList = () => {
  cachedPromise = null;
};

// The declaration of one widget instance, or null when the integration is
// no longer installed (or never declared that key)
export const findWidgetDeclaration = (widgets, integrationSelector, widgetKey) =>
  (widgets || []).find(widget => widget.integration_selector === integrationSelector && widget.key === widgetKey) ||
  null;
