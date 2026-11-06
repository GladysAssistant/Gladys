const Promise = require('bluebird');

const db = require('../../../models');
const logger = require('../../../utils/logger');
const { SERVICE_TYPES } = require('../../../utils/constants');
const { STORE_INDEX_CACHE_VARIABLE } = require('./store.constants');
const { getStoreIndexUrls, downloadIndex, toLiteIndex } = require('./store.downloadIndex');

/**
 * @description Download the lite store index (a static index-lite.json
 * rebuilt by a fully automatic indexer crawling the
 * `gladys-assistant-integration` GitHub topic: every entry, with the manifest
 * reduced to what the catalog needs) and persist it in the local cache: the
 * catalog stays available offline or if the store storage is down, and
 * installed integrations never depend on the index to work. Also refreshes
 * the manifests of integrations installed by repo_url that are absent from
 * the index (not crawled yet), for update detection.
 * @returns {Promise<object>} Resolve with the lite index.
 * @example
 * await gladys.externalIntegration.refreshIndex();
 */
async function refreshIndex() {
  const data = toLiteIndex(await downloadIndex(getStoreIndexUrls().liteIndexUrl));
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
