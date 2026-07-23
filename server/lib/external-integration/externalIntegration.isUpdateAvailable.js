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
  if (latestVersion === null && this.repoManifests.has(service.store_slug)) {
    latestVersion = this.repoManifests.get(service.store_slug).version;
  }
  if (latestVersion === null || semver.valid(latestVersion) === null || semver.valid(service.version) === null) {
    return false;
  }
  return semver.gt(latestVersion, service.version);
}

module.exports = {
  isUpdateAvailable,
};
