const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Install an integration from the store: the server resolves
 * the image and the complete manifest from the store entry of the
 * integration (its per-integration file), then
 * follows the standard install path.
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @param {object} [options] - Install options (grantedDevices...).
 * @returns {Promise<object>} Resolve with the installed integration.
 * @example
 * await gladys.externalIntegration.installFromStore('john/gladys-open-meteo-demo');
 */
async function installFromStore(storeSlug, options = {}) {
  const entry = await this.getStoreEntry(storeSlug);
  if (entry === null) {
    throw new NotFoundError('INTEGRATION_NOT_FOUND_IN_STORE');
  }
  this.validateManifest(entry.manifest);
  return this.install({ manifest: entry.manifest, storeSlug, ...options });
}

module.exports = {
  installFromStore,
};
