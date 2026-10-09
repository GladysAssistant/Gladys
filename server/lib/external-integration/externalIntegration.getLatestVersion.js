const semver = require('semver');

/**
 * @description Latest version known for an installed external integration:
 * the version carried by the store index cache (linked by store_slug), or the
 * one of the manifest fetched directly from the repo when we already read it
 * (integration absent from the index, or update forced by the admin). The
 * index lags behind the repo by up to 1h30 (hourly rebuild + 30 min client
 * cache), so the highest of the two known versions wins.
 * @param {object} service - The external integration service (plain object).
 * @returns {string|null} The latest known version, or null when unknown.
 * @example
 * const latestVersion = gladys.externalIntegration.getLatestVersion(service);
 */
function getLatestVersion(service) {
  if (!service.store_slug) {
    return null;
  }
  let latestVersion = null;
  if (this.storeIndex && Array.isArray(this.storeIndex.integrations)) {
    const indexEntry = this.storeIndex.integrations.find((entry) => entry.store_slug === service.store_slug);
    if (indexEntry && indexEntry.manifest) {
      latestVersion = indexEntry.manifest.version;
    }
  }
  if (this.repoManifests.has(service.store_slug)) {
    const repoVersion = this.repoManifests.get(service.store_slug).version;
    if (
      semver.valid(repoVersion) !== null &&
      (semver.valid(latestVersion) === null || semver.gt(repoVersion, latestVersion))
    ) {
      latestVersion = repoVersion;
    }
  }
  if (latestVersion === null || semver.valid(latestVersion) === null) {
    return null;
  }
  return latestVersion;
}

module.exports = {
  getLatestVersion,
};
