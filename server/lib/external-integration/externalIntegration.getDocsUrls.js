/**
 * @description Get the re-hosted documentation URLs of an installed
 * integration ({ en: '...', fr: '...' }), from the store index cache
 * (linked by store_slug). The docs are mandatory for store-published
 * integrations (validated by the indexer); dev installs have none. Used
 * by the Configuration screen, where a permanent Documentation link
 * matters most (create the vendor developer account, get credentials...).
 * @param {object} service - The external integration service (plain object).
 * @returns {object|null} The documentation URLs by language, or null.
 * @example
 * const docs = gladys.externalIntegration.getDocsUrls(service);
 */
function getDocsUrls(service) {
  if (!service.store_slug || !this.storeIndex || !Array.isArray(this.storeIndex.integrations)) {
    return null;
  }
  const indexEntry = this.storeIndex.integrations.find((entry) => entry.store_slug === service.store_slug);
  return (indexEntry && indexEntry.docs) || null;
}

module.exports = {
  getDocsUrls,
};
