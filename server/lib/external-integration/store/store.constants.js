// Static index rebuilt hourly by the public indexer
// (GladysAssistant/integration-store) and served from the store storage.
// Overridable by env variable, useful for tests and to point to an
// alternative index (e.g. a self-hosted fork).
const DEFAULT_STORE_INDEX_URL = 'https://integration-store-storage.gladysassistant.com/index.json';
// Local persistent cache of the index (t_variable), so the catalog stays
// available offline.
const STORE_INDEX_CACHE_VARIABLE = 'EXTERNAL_INTEGRATION_STORE_INDEX_CACHE';
// The index is refreshed every 12 hours.
const STORE_INDEX_TTL_MS = 12 * 60 * 60 * 1000;
const SUPPORTED_INDEX_FORMAT = 1;
const STORE_HTTP_TIMEOUT_MS = 30 * 1000;

module.exports = {
  DEFAULT_STORE_INDEX_URL,
  STORE_INDEX_CACHE_VARIABLE,
  STORE_INDEX_TTL_MS,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
};
