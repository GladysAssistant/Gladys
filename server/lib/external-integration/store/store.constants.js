// Static files rebuilt hourly by the public indexer
// (GladysAssistant/integration-store) and served from the store storage.
// Overridable by env variable, useful for tests and to point to an
// alternative store (e.g. a self-hosted fork), see store.downloadIndex.js.
// The lite index carries every entry with the manifest reduced to what the
// catalog list, the compatibility check and the update detection read: this
// is the one refreshed periodically, kept in memory and in the cache. The
// complete manifest of one integration (config schema, widgets, scene
// declarations...) comes from its own file, `integrations/<owner>--<repo>.json`
// next to the index (its URL is the `entry_url` of the lite entry), downloaded
// only when needed (install page, install, update). The full index
// `index.json` the indexer also publishes (every complete manifest, tens of
// megabytes) is never downloaded by Gladys.
const DEFAULT_STORE_INDEX_LITE_URL = 'https://integration-store-storage.gladysassistant.com/index-lite.json';
// Path of the per-integration file, relative to the lite index, when a lite
// entry does not carry a usable `entry_url` (a cache written by an older
// indexer or core, an integration not crawled yet, a URL on another origin).
const STORE_ENTRY_PATH = 'integrations/';
// Shape of a store slug (`owner/repo`, the GitHub repository): one path
// segment each, so a slug can never derive a URL outside `integrations/`.
const STORE_SLUG_REGEX = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
// A complete entry is a few kilobytes: the cap only protects against a
// mis-pointed URL (the full index again) or a rogue file.
const MAX_STORE_ENTRY_BYTES = 1024 * 1024;
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
  'keywords',
  'countries',
];
// Local persistent cache of the lite index (t_variable), so the catalog stays
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
  DEFAULT_STORE_INDEX_LITE_URL,
  STORE_ENTRY_PATH,
  MAX_STORE_ENTRY_BYTES,
  STORE_SLUG_REGEX,
  STORE_INDEX_LITE_MANIFEST_FIELDS,
  STORE_INDEX_CACHE_VARIABLE,
  STORE_INDEX_TTL_MS,
  SUPPORTED_INDEX_FORMAT,
  STORE_HTTP_TIMEOUT_MS,
  MAX_DOCS_MARKDOWN_BYTES,
};
