/**
 * @description Latest version known for an installed external integration:
 * the version of the manifest resolved by getLatestManifest (store index
 * cache, or manifest read from the repo — the highest of the two).
 * @param {object} service - The external integration service (plain object).
 * @returns {string|null} The latest known version, or null when unknown.
 * @example
 * const latestVersion = gladys.externalIntegration.getLatestVersion(service);
 */
function getLatestVersion(service) {
  const latestManifest = this.getLatestManifest(service);
  return latestManifest === null ? null : latestManifest.version;
}

module.exports = {
  getLatestVersion,
};
