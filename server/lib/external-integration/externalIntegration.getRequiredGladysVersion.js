const semver = require('semver');

const { coerceGladysVersion, getUnsatisfiedGladysVersion } = require('./store/store.buildCatalogEntry');

/**
 * @description The Gladys version a newer release of an installed external
 * integration requires, when the running Gladys does not satisfy it: the
 * `gladys_version` range of the latest known manifest (getLatestManifest).
 * Such a release is not an update this instance can apply — it is not
 * flagged as available (isUpdateAvailable), the admin is told to update
 * Gladys first instead.
 * @param {object} service - The external integration service (plain object).
 * @returns {string|null} The unsatisfied `gladys_version` range (e.g. ">=5.3.0"),
 * or null when no newer version is known or when the running Gladys satisfies it.
 * @example
 * const requiredGladysVersion = gladys.externalIntegration.getRequiredGladysVersion(service);
 */
function getRequiredGladysVersion(service) {
  const latestManifest = this.getLatestManifest(service);
  if (
    latestManifest === null ||
    semver.valid(service.version) === null ||
    !semver.gt(latestManifest.version, service.version)
  ) {
    return null;
  }
  return getUnsatisfiedGladysVersion(latestManifest, coerceGladysVersion(this.system.gladysVersion));
}

module.exports = {
  getRequiredGladysVersion,
};
