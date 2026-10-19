const axios = require('axios');

const {
  DEFAULT_STORE_INDEX_URL,
  DEFAULT_STORE_INDEX_LITE_URL,
  STORE_INDEX_LITE_MANIFEST_FIELDS,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
} = require('./store.constants');

/**
 * @description URLs of the two store indexes. An alternative full index set
 * without its lite variant (a self-hosted fork) also serves the catalog: a
 * full index is a valid lite index, only heavier.
 * @returns {object} The { indexUrl, liteIndexUrl } URLs.
 * @example
 * const { liteIndexUrl } = getStoreIndexUrls();
 */
function getStoreIndexUrls() {
  const customIndexUrl = process.env.EXTERNAL_INTEGRATION_STORE_INDEX_URL;
  const indexUrl = customIndexUrl || DEFAULT_STORE_INDEX_URL;
  const liteIndexUrl =
    process.env.EXTERNAL_INTEGRATION_STORE_INDEX_LITE_URL || customIndexUrl || DEFAULT_STORE_INDEX_LITE_URL;
  return { indexUrl, liteIndexUrl };
}

/**
 * @description Download a store index and check its format.
 * @param {string} url - The URL of the index.
 * @returns {Promise<object>} Resolve with the index.
 * @example
 * const index = await downloadIndex(getStoreIndexUrls().indexUrl);
 */
async function downloadIndex(url) {
  const { data } = await axios.get(url, { timeout: STORE_HTTP_TIMEOUT_MS });
  if (!data || data.index_format !== SUPPORTED_INDEX_FORMAT || !Array.isArray(data.integrations)) {
    throw new Error('INVALID_STORE_INDEX');
  }
  return data;
}

/**
 * @description Reduce an index to its lite form: same entries, manifest
 * restricted to the lite fields.
 * @param {object} index - A full or lite index.
 * @returns {object} The lite index.
 * @example
 * const liteIndex = toLiteIndex(index);
 */
function toLiteIndex(index) {
  return {
    ...index,
    integrations: index.integrations.map((entry) => {
      const manifest = entry.manifest || {};
      const liteManifest = {};
      STORE_INDEX_LITE_MANIFEST_FIELDS.forEach((field) => {
        if (manifest[field] !== undefined) {
          liteManifest[field] = manifest[field];
        }
      });
      return { ...entry, manifest: liteManifest };
    }),
  };
}

module.exports = {
  getStoreIndexUrls,
  downloadIndex,
  toLiteIndex,
};
