const semver = require('semver');

/**
 * @description Check if an update is available for an installed external
 * integration, by comparing the installed version with the latest version
 * known for it (store index cache, or manifest read from the repo — see
 * getLatestVersion).
 * @param {object} service - The external integration service (plain object).
 * @returns {boolean} True if a newer version is available.
 * @example
 * const updateAvailable = gladys.externalIntegration.isUpdateAvailable(service);
 */
function isUpdateAvailable(service) {
  const latestVersion = this.getLatestVersion(service);
  if (latestVersion === null || semver.valid(service.version) === null) {
    return false;
  }
  return semver.gt(latestVersion, service.version);
}

module.exports = {
  isUpdateAvailable,
};
