const semver = require('semver');

/**
 * @description Manifest of the latest version known for an installed
 * external integration: the manifest carried by the store index cache
 * (linked by store_slug — a lite manifest, C.6), or the one fetched directly
 * from the repo when we already read it (integration absent from the index,
 * or update forced by the admin). The index lags behind the repo by up to
 * 1h30 (hourly rebuild + 30 min client cache), so the highest of the two
 * known versions wins, the index winning ties.
 * @param {object} service - The external integration service (plain object).
 * @returns {object|null} The manifest of the latest known version, or null when unknown.
 * @example
 * const latestManifest = gladys.externalIntegration.getLatestManifest(service);
 */
function getLatestManifest(service) {
  if (!service.store_slug) {
    return null;
  }
  let latestManifest = null;
  if (this.storeIndex && Array.isArray(this.storeIndex.integrations)) {
    const indexEntry = this.storeIndex.integrations.find((entry) => entry.store_slug === service.store_slug);
    if (indexEntry && indexEntry.manifest) {
      latestManifest = indexEntry.manifest;
    }
  }
  if (this.repoManifests.has(service.store_slug)) {
    const repoManifest = this.repoManifests.get(service.store_slug);
    if (
      semver.valid(repoManifest.version) !== null &&
      (latestManifest === null ||
        semver.valid(latestManifest.version) === null ||
        semver.gt(repoManifest.version, latestManifest.version))
    ) {
      latestManifest = repoManifest;
    }
  }
  if (latestManifest === null || semver.valid(latestManifest.version) === null) {
    return null;
  }
  return latestManifest;
}

module.exports = {
  getLatestManifest,
};
