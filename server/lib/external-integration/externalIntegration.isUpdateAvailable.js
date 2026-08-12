const semver = require('semver');

/**
 * @description Check if an update is available for an installed external
 * integration, by comparing the installed version with the version known by
 * the store index cache (linked by store_slug), or with the manifest fetched
 * directly from the repo for integrations installed by repo_url and absent
 * from the index.
 * @param {object} service - The external integration service (plain object).
 * @returns {boolean} True if a newer version is available.
 * @example
 * const updateAvailable = gladys.externalIntegration.isUpdateAvailable(service);
 */
function isUpdateAvailable(service) {
  if (!service.store_slug) {
    return false;
  }
  let latestVersion = null;
  if (this.storeIndex && Array.isArray(this.storeIndex.integrations)) {
    const indexEntry = this.storeIndex.integrations.find((entry) => entry.store_slug === service.store_slug);
    if (indexEntry && indexEntry.manifest) {
      latestVersion = indexEntry.manifest.version;
    }
  }
  if (this.repoManifests.has(service.store_slug)) {
    // the index lags behind the repo by up to 1h30 (hourly rebuild + 30 min
    // client cache): whenever we already read the repo manifest (integration
    // absent from the index, or update forced by the admin), the highest of
    // the two known versions is the one to compare against
    const repoVersion = this.repoManifests.get(service.store_slug).version;
    if (
      semver.valid(repoVersion) !== null &&
      (semver.valid(latestVersion) === null || semver.gt(repoVersion, latestVersion))
    ) {
      latestVersion = repoVersion;
    }
  }
  if (latestVersion === null || semver.valid(latestVersion) === null || semver.valid(service.version) === null) {
    return false;
  }
  return semver.gt(latestVersion, service.version);
}

module.exports = {
  isUpdateAvailable,
};
