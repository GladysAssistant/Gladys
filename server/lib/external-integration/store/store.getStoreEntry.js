const { STORE_INDEX_TTL_MS } = require('./store.constants');
const { getStoreEntryUrl, downloadStoreEntry } = require('./store.downloadIndex');

/**
 * @description Get the complete store entry of one integration (the same
 * entry as in the catalog, with its complete manifest: config schema,
 * widgets, scene declarations...). The lite index kept for the catalog does
 * not carry them, so the per-integration file of the store is downloaded on
 * demand: a few kilobytes, at the `entry_url` of the lite entry (derived from
 * the store layout when the lite index does not know the integration yet).
 * The full index, which carries every complete manifest, is never
 * downloaded. Only the last entry fetched is kept, for 30 minutes, which
 * covers the install page followed by the install click.
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @param {object} [options] - Options.
 * @param {boolean} [options.refresh] - Ignore the cached entry.
 * @returns {Promise<object|null>} Resolve with the entry, or null when the
 * integration is not in the store.
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
  const index = await this.getIndex();
  const liteEntry = index === null ? null : index.integrations.find((entry) => entry.store_slug === storeSlug);
  const url = (liteEntry && liteEntry.entry_url) || getStoreEntryUrl(storeSlug);
  const entry = await downloadStoreEntry(url, storeSlug);
  if (entry !== null) {
    this.storeEntryCache = { entry, fetchedAt: Date.now() };
  }
  return entry;
}

module.exports = {
  getStoreEntry,
};
