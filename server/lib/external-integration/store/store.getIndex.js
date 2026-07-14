const logger = require('../../../utils/logger');
const { STORE_INDEX_CACHE_VARIABLE, STORE_INDEX_TTL_MS } = require('./store.constants');

/**
 * @description Get the store index: in-memory copy if fresh (< 12h),
 * otherwise refreshed from the network, with fallback on the local
 * persistent cache when the network or GitHub Pages is unavailable. Can
 * return null when no index was ever fetched: the worst case (GitHub fully
 * down) suspends the discovery of new integrations, never the operation of
 * installed ones.
 * @param {object} [options] - Options.
 * @param {boolean} [options.refresh] - Force a refresh of the index.
 * @returns {Promise<object|null>} Resolve with the index, or null.
 * @example
 * const index = await gladys.externalIntegration.getIndex();
 */
async function getIndex({ refresh = false } = {}) {
  const isFresh = this.storeIndex !== null && Date.now() - this.storeIndexFetchedAt < STORE_INDEX_TTL_MS;
  if (!refresh && isFresh) {
    return this.storeIndex;
  }
  try {
    return await this.refreshIndex();
  } catch (e) {
    logger.warn('Unable to refresh the integration store index', e);
  }
  if (this.storeIndex === null) {
    // second line of defense: the local persistent cache
    const cached = await this.variable.getValue(STORE_INDEX_CACHE_VARIABLE);
    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached);
        this.storeIndex = parsed.index;
        this.storeIndexFetchedAt = parsed.fetched_at || 0;
      } catch (e) {
        logger.warn('Invalid store index local cache', e);
      }
    }
  }
  return this.storeIndex;
}

module.exports = {
  getIndex,
};
