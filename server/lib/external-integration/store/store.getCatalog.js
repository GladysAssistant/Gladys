const semver = require('semver');

const { INTEGRATION_CATALOG_CATEGORIES } = require('../../../utils/constants');

const KNOWN_CATEGORIES = new Set(INTEGRATION_CATALOG_CATEGORIES);

/**
 * @description Build the store catalog for the frontend: index entries with
 * the `installed` / `update_available` flags, and the `compatible` flag
 * computed from the current Gladys version against the gladys_version range
 * of each manifest.
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
  const coercedVersion = this.system.gladysVersion ? semver.coerce(this.system.gladysVersion) : null;
  const gladysVersion = coercedVersion ? coercedVersion.version : null;
  let integrations = ((index && index.integrations) || []).map((entry) => {
    const installedService = installedBySlug.get(entry.store_slug);
    // the index is external data: a malformed range must not abort the catalog
    const gladysVersionRange = semver.validRange(entry.manifest.gladys_version);
    let compatible = false;
    if (gladysVersionRange !== null) {
      compatible = gladysVersion === null ? true : semver.satisfies(gladysVersion, gladysVersionRange);
    }
    return {
      store_slug: entry.store_slug,
      repo_url: entry.repo_url,
      manifest: entry.manifest,
      cover_url: entry.cover_url,
      github: entry.github,
      docs: entry.docs || null,
      // browse categories computed by the indexer (manifest field or fallback
      // mapping): keys from a newer vocabulary than this instance knows are
      // dropped, never a reason to hide the integration
      categories: Array.isArray(entry.categories)
        ? entry.categories.filter((category) => KNOWN_CATEGORIES.has(category))
        : [],
      // first indexing date of the store_slug, persisted by the indexer
      // across rebuilds: powers the "Newest first" sort of the catalog
      first_seen_at: typeof entry.first_seen_at === 'string' ? entry.first_seen_at : null,
      installed: installedService !== undefined,
      installed_selector: installedService ? installedService.selector : null,
      update_available: installedService ? installedService.update_available : false,
      compatible,
    };
  });
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
