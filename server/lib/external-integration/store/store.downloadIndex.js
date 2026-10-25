const axios = require('axios');

const {
  DEFAULT_STORE_INDEX_LITE_URL,
  STORE_ENTRY_PATH,
  STORE_INDEX_LITE_MANIFEST_FIELDS,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
} = require('./store.constants');

/**
 * @description URL of the lite store index. `EXTERNAL_INTEGRATION_STORE_INDEX_LITE_URL`
 * points at an alternative one (a self-hosted fork); the older
 * `EXTERNAL_INTEGRATION_STORE_INDEX_URL` is still honoured for a fork that
 * only serves its full index: a full index is a valid lite index, only
 * heavier.
 * @returns {object} The { liteIndexUrl } URL.
 * @example
 * const { liteIndexUrl } = getStoreIndexUrls();
 */
function getStoreIndexUrls() {
  const liteIndexUrl =
    process.env.EXTERNAL_INTEGRATION_STORE_INDEX_LITE_URL ||
    process.env.EXTERNAL_INTEGRATION_STORE_INDEX_URL ||
    DEFAULT_STORE_INDEX_LITE_URL;
  return { liteIndexUrl };
}

/**
 * @description URL of the per-integration file of a store entry, derived
 * from the store layout (`integrations/<owner>--<repo>.json` next to the
 * index) for a lite entry that does not carry its `entry_url`.
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @returns {string} The URL of the per-integration file.
 * @example
 * const url = getStoreEntryUrl('john/gladys-open-meteo-demo');
 */
function getStoreEntryUrl(storeSlug) {
  const { liteIndexUrl } = getStoreIndexUrls();
  return new URL(`${STORE_ENTRY_PATH}${storeSlug.replace('/', '--')}.json`, liteIndexUrl).href;
}

/**
 * @description Download a store index and check its format.
 * @param {string} url - The URL of the index.
 * @returns {Promise<object>} Resolve with the index.
 * @example
 * const index = await downloadIndex(getStoreIndexUrls().liteIndexUrl);
 */
async function downloadIndex(url) {
  const { data } = await axios.get(url, { timeout: STORE_HTTP_TIMEOUT_MS });
  if (!data || data.index_format !== SUPPORTED_INDEX_FORMAT || !Array.isArray(data.integrations)) {
    throw new Error('INVALID_STORE_INDEX');
  }
  return data;
}

/**
 * @description Download the per-integration file of a store entry (the same
 * entry as in the full index, complete manifest included) and check it is
 * the one asked for.
 * @param {string} url - The URL of the per-integration file.
 * @param {string} storeSlug - The `owner/repo` slug the file must describe.
 * @returns {Promise<object|null>} Resolve with the entry, or null when the
 * store has no file for this integration.
 * @example
 * const entry = await downloadStoreEntry(url, 'john/gladys-open-meteo-demo');
 */
async function downloadStoreEntry(url, storeSlug) {
  let data;
  try {
    ({ data } = await axios.get(url, { timeout: STORE_HTTP_TIMEOUT_MS }));
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return null;
    }
    throw e;
  }
  if (!data || data.store_slug !== storeSlug || !data.manifest || typeof data.manifest !== 'object') {
    throw new Error('INVALID_STORE_ENTRY');
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
  getStoreEntryUrl,
  downloadIndex,
  downloadStoreEntry,
  toLiteIndex,
};
