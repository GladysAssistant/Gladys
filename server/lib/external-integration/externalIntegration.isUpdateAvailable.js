const semver = require('semver');

/**
 * @description Check if an update is available for an installed external
 * integration, by comparing the installed version with the latest version
 * known for it (store index cache, or manifest read from the repo — see
 * getLatestVersion). A newer version the running Gladys does not satisfy
 * (`gladys_version`) is not an update this instance can apply: it is not
 * flagged, getRequiredGladysVersion reports it instead — flagged, it would
 * be offered, counted, and "updated" by re-pulling the current image.
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
  return semver.gt(latestVersion, service.version) && this.getRequiredGladysVersion(service) === null;
}

module.exports = {
  isUpdateAvailable,
};
