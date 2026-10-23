const { buildCatalogEntry, coerceGladysVersion } = require('./store.buildCatalogEntry');

/**
 * @description Build the store catalog for the frontend: the entries of the
 * lite index (manifest reduced to what the list needs) with the
 * `installed` / `update_available` flags, and the `compatible` flag computed
 * from the current Gladys version against the gladys_version range of each
 * manifest. The complete manifest of one integration is served by
 * getStoreIntegration.
 * @param {object} [options] - Options.
 * @param {string} [options.search] - Search keyword.
 * @param {boolean} [options.refresh] - Force a refresh of the index.
 * @returns {Promise<object>} Resolve with { refreshed_at, integrations }.
 * @example
 * const catalog = await gladys.externalIntegration.getCatalog({ search: 'meteo' });
 */
async function getCatalog({ search, refresh = false } = {}) {
  const index = await this.getIndex({ refresh });
  const installedIntegrations = await this.get();
  const installedBySlug = new Map(
    installedIntegrations.filter((service) => service.store_slug).map((service) => [service.store_slug, service]),
  );
  const gladysVersion = coerceGladysVersion(this.system.gladysVersion);
  let integrations = ((index && index.integrations) || []).map((entry) =>
    buildCatalogEntry(entry, installedBySlug.get(entry.store_slug), gladysVersion),
  );
  if (search) {
    const keyword = search.toLowerCase();
    integrations = integrations.filter((entry) => {
      const name = (entry.manifest.name || '').toLowerCase();
      const descriptions = Object.values(entry.manifest.description || {})
        .join(' ')
        .toLowerCase();
      return name.includes(keyword) || descriptions.includes(keyword) || entry.store_slug.includes(keyword);
    });
  }
  return {
    refreshed_at: this.storeIndexFetchedAt ? new Date(this.storeIndexFetchedAt).toISOString() : null,
    integrations,
  };
}

module.exports = {
  getCatalog,
};
