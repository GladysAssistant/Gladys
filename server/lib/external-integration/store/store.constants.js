// Static indexes rebuilt hourly by the public indexer
// (GladysAssistant/integration-store) and served from the store storage.
// Overridable by env variables, useful for tests and to point to an
// alternative index (e.g. a self-hosted fork), see store.downloadIndex.js.
// The full index carries the complete manifest of every integration (config
// schema, widgets, scene declarations...): with hundreds of integrations it
// weighs megabytes, so it is only downloaded when one complete manifest is
// needed (install page, install, update).
const DEFAULT_STORE_INDEX_URL = 'https://integration-store-storage.gladysassistant.com/index.json';
// The lite index carries the same entries with the manifest reduced to what
// the catalog list, the compatibility check and the update detection read:
// this is the one refreshed periodically, kept in memory and in the cache.
const DEFAULT_STORE_INDEX_LITE_URL = 'https://integration-store-storage.gladysassistant.com/index-lite.json';
// Manifest fields of a lite index entry. Anything else is dropped when an
// index is kept as the catalog index, so a full index (cached before the lite
// one existed, or served by a fork without a lite variant) never weighs on
// memory, on the cache, nor on the catalog sent to the frontend.
const STORE_INDEX_LITE_MANIFEST_FIELDS = [
  'manifest_version',
  'type',
  'name',
  'description',
  'version',
  'docker_image',
  'gladys_version',
  'transports',
];
// Local persistent cache of the index (t_variable), so the catalog stays
// available offline.
const STORE_INDEX_CACHE_VARIABLE = 'EXTERNAL_INTEGRATION_STORE_INDEX_CACHE';
// The index is refreshed every 30 minutes: the public indexer rebuilds it
// hourly, so a shorter TTL keeps the catalog close to the upstream index
// without hammering the store storage.
const STORE_INDEX_TTL_MS = 30 * 60 * 1000;
const SUPPORTED_INDEX_FORMAT = 1;
const STORE_HTTP_TIMEOUT_MS = 30 * 1000;
// Documentation files are re-hosted markdown: 1 MB is far above any
// legitimate doc, the cap only protects against a rogue index entry.
const MAX_DOCS_MARKDOWN_BYTES = 1024 * 1024;

module.exports = {
  DEFAULT_STORE_INDEX_URL,
  DEFAULT_STORE_INDEX_LITE_URL,
  STORE_INDEX_LITE_MANIFEST_FIELDS,
  STORE_INDEX_CACHE_VARIABLE,
  STORE_INDEX_TTL_MS,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
  MAX_DOCS_MARKDOWN_BYTES,
};
