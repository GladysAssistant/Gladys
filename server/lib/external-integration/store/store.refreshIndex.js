const axios = require('axios');
const Promise = require('bluebird');

const db = require('../../../models');
const logger = require('../../../utils/logger');
const { SERVICE_TYPES } = require('../../../utils/constants');
const {
  DEFAULT_STORE_INDEX_URL,
  STORE_INDEX_CACHE_VARIABLE,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
} = require('./store.constants');

/**
 * @description Download the store index (a static index.json rebuilt by a
 * fully automatic indexer crawling the `gladys-assistant-integration` GitHub
 * topic) and persist it in the local cache: the catalog stays available
 * offline or if GitHub Pages is down, and installed integrations never
 * depend on the index to work. Also refreshes the manifests of integrations
 * installed by repo_url that are absent from the index (not crawled yet),
 * for update detection.
 * @returns {Promise<object>} Resolve with the index.
 * @example
 * await gladys.externalIntegration.refreshIndex();
 */
async function refreshIndex() {
  const indexUrl = process.env.EXTERNAL_INTEGRATION_STORE_INDEX_URL || DEFAULT_STORE_INDEX_URL;
  const { data } = await axios.get(indexUrl, { timeout: STORE_HTTP_TIMEOUT_MS });
  if (!data || data.index_format !== SUPPORTED_INDEX_FORMAT || !Array.isArray(data.integrations)) {
    throw new Error('INVALID_STORE_INDEX');
  }
  this.storeIndex = data;
  this.storeIndexFetchedAt = Date.now();
  await this.variable.setValue(
    STORE_INDEX_CACHE_VARIABLE,
    JSON.stringify({ fetched_at: this.storeIndexFetchedAt, index: data }),
  );
  // integrations installed by repo_url and absent from the index: refresh
  // their manifest directly from their repo (same update detection)
  const installedServices = await db.Service.findAll({
    where: { type: SERVICE_TYPES.EXTERNAL, pod_id: null },
  });
  const notIndexed = installedServices.filter(
    (service) => service.store_slug && !data.integrations.some((entry) => entry.store_slug === service.store_slug),
  );
  await Promise.each(notIndexed, async (service) => {
    try {
      const manifest = await this.fetchManifestFromRepo(service.store_slug);
      this.repoManifests.set(service.store_slug, manifest);
    } catch (e) {
      logger.debug(`Unable to refresh manifest of ${service.store_slug}`, e);
    }
  });
  return this.storeIndex;
}

module.exports = {
  refreshIndex,
};
