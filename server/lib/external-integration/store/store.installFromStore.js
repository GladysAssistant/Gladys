const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Install an integration from the store: the server resolves
 * the image and the manifest from its index cache, then follows the standard
 * install path.
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @param {object} [options] - Install options (grantedDevices...).
 * @returns {Promise<object>} Resolve with the installed integration.
 * @example
 * await gladys.externalIntegration.installFromStore('john/gladys-open-meteo-demo');
 */
async function installFromStore(storeSlug, options = {}) {
  const index = await this.getIndex();
  const entry = ((index && index.integrations) || []).find((indexEntry) => indexEntry.store_slug === storeSlug);
  if (!entry) {
    throw new NotFoundError('INTEGRATION_NOT_FOUND_IN_STORE');
  }
  this.validateManifest(entry.manifest);
  return this.install({ manifest: entry.manifest, storeSlug, ...options });
}

module.exports = {
  installFromStore,
};
