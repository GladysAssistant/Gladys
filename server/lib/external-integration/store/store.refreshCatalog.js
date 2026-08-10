/**
 * @description Refresh the store index on demand and report whether the
 * download actually happened. An unreachable store never fails getIndex: it
 * falls back on the cached index, so the catalog alone cannot tell a real
 * refresh from a served-from-cache one. The fetch timestamp only moves on a
 * successful download, so comparing it around the call is the reliable
 * signal — and the caller must be told, otherwise the UI reports a fresh
 * catalog that was never downloaded.
 * @returns {Promise<object>} Resolve with { refreshed, refreshed_at, integrations }.
 * @example
 * const catalog = await gladys.externalIntegration.refreshCatalog();
 */
async function refreshCatalog() {
  const fetchedAtBefore = this.storeIndexFetchedAt;
  const catalog = await this.getCatalog({ refresh: true });
  return {
    ...catalog,
    refreshed: this.storeIndexFetchedAt !== fetchedAtBefore,
  };
}

module.exports = {
  refreshCatalog,
};
