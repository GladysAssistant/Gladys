const { NotFoundError } = require('../../../utils/coreErrors');
const { buildCatalogEntry, coerceGladysVersion } = require('./store.buildCatalogEntry');

/**
 * @description One store integration for its install page: the same entry
 * as in the catalog, but with the complete manifest (the hardware, widgets
 * and scene declarations the install page summarizes).
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @returns {Promise<object>} Resolve with the catalog entry.
 * @example
 * const integration = await gladys.externalIntegration.getStoreIntegration('john/gladys-open-meteo-demo');
 */
async function getStoreIntegration(storeSlug) {
  const entry = await this.getStoreEntry(storeSlug);
  if (entry === null) {
    throw new NotFoundError('INTEGRATION_NOT_FOUND_IN_STORE');
  }
  const installedIntegrations = await this.get();
  const installedService = installedIntegrations.find((service) => service.store_slug === storeSlug);
  return buildCatalogEntry(entry, installedService, coerceGladysVersion(this.system.gladysVersion));
}

module.exports = {
  getStoreIntegration,
};
