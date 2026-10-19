const { STORE_INDEX_TTL_MS } = require('./store.constants');
const { getStoreIndexUrls, downloadIndex } = require('./store.downloadIndex');

/**
 * @description Get the full index entry of one store integration, with its
 * complete manifest (config schema, widgets, scene declarations...). The lite
 * index kept for the catalog does not carry them, so the full index is
 * downloaded on demand and only the requested entry is kept: the last one
 * fetched, for 30 minutes, which covers the install page followed by the
 * install click without holding the whole store in memory.
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @param {object} [options] - Options.
 * @param {boolean} [options.refresh] - Ignore the cached entry.
 * @returns {Promise<object|null>} Resolve with the entry, or null when the
 * integration is not in the index.
 * @example
 * const entry = await gladys.externalIntegration.getStoreEntry('john/gladys-open-meteo-demo');
 */
async function getStoreEntry(storeSlug, { refresh = false } = {}) {
  const cached = this.storeEntryCache;
  if (
    !refresh &&
    cached !== null &&
    cached.entry.store_slug === storeSlug &&
    Date.now() - cached.fetchedAt < STORE_INDEX_TTL_MS
  ) {
    return cached.entry;
  }
  const index = await downloadIndex(getStoreIndexUrls().indexUrl);
  const entry = index.integrations.find((indexEntry) => indexEntry.store_slug === storeSlug) || null;
  if (entry !== null) {
    this.storeEntryCache = { entry, fetchedAt: Date.now() };
  }
  return entry;
}

module.exports = {
  getStoreEntry,
};
