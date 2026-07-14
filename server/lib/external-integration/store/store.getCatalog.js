const semver = require('semver');

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
    return {
      store_slug: entry.store_slug,
      repo_url: entry.repo_url,
      manifest: entry.manifest,
      cover_url: entry.cover_url,
      github: entry.github,
      installed: installedService !== undefined,
      installed_selector: installedService ? installedService.selector : null,
      update_available: installedService ? installedService.update_available : false,
      compatible: gladysVersion === null ? true : semver.satisfies(gladysVersion, entry.manifest.gladys_version),
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
