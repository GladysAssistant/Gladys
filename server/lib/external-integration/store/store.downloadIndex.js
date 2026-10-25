const axios = require('axios');

const {
  DEFAULT_STORE_INDEX_LITE_URL,
  STORE_ENTRY_PATH,
  MAX_STORE_ENTRY_BYTES,
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
 * @description URL of the per-integration file of a store entry: the
 * `entry_url` of its lite entry when it points at the origin of the
 * configured lite index — the index is unmoderated external data, it must not
 * send the core to an arbitrary host — else derived from the store layout
 * (`integrations/<owner>--<repo>.json` next to the index).
 * @param {string} storeSlug - The `owner/repo` slug of the store entry.
 * @param {string} [entryUrl] - The `entry_url` of the lite entry, if any.
 * @returns {string} The URL of the per-integration file.
 * @example
 * const url = getStoreEntryUrl('john/gladys-open-meteo-demo', liteEntry.entry_url);
 */
function getStoreEntryUrl(storeSlug, entryUrl = null) {
  const { liteIndexUrl } = getStoreIndexUrls();
  if (typeof entryUrl === 'string') {
    try {
      if (new URL(entryUrl).origin === new URL(liteIndexUrl).origin) {
        return entryUrl;
      }
    } catch (e) {
      // malformed entry_url: the derived URL below
    }
  }
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
 * the one asked for. The body is capped at MAX_STORE_ENTRY_BYTES: a complete
 * entry is a few kilobytes, a bigger file is not one (the full index served
 * at the wrong URL, a rogue file) and is refused before being buffered.
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
    ({ data } = await axios.get(url, { timeout: STORE_HTTP_TIMEOUT_MS, maxContentLength: MAX_STORE_ENTRY_BYTES }));
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
