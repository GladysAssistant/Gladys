/**
 * @description Get the sub-container declarations of an integration (the
 * `containers` field of its manifest — the authorization contract: the
 * /container API can only drive what is listed here).
 * @param {object} service - The external integration service (plain object).
 * @returns {Array} The declared sub-containers (empty array if none).
 * @example
 * const containers = gladys.externalIntegration.getManifestContainers(service);
 */
function getManifestContainers(service) {
  if (!service.manifest || !Array.isArray(service.manifest.containers)) {
    return [];
  }
  return service.manifest.containers;
}

module.exports = {
  getManifestContainers,
};
