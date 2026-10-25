import { INTEGRATION_CATALOG_CATEGORIES } from '../../../../server/utils/constants';
import { version as GLADYS_VERSION } from '../../../../package.json';

/**
 * The community integration store of the demo.
 *
 * This is the one thing the demo does not invent. The catalog of external
 * integrations is a public static index (`index-lite.json`, every entry with
 * the manifest reduced to what the list needs) rebuilt hourly by the indexer
 * (GladysAssistant/integration-store) and downloaded by every Gladys instance
 * — see `server/lib/external-integration/store/store.constants.js`, which
 * this file mirrors. The demo downloads the very same file, straight from the
 * browser, so the demo catalog *is* the live catalog: a snapshot committed
 * here would be a week out of date and would show integrations that no longer
 * exist (or, worse, hide the ones published since). The complete manifest of
 * one integration (its install page, its install) comes from its own file in
 * the store (`integrations/<owner>--<repo>.json`, the `entry_url` of the lite
 * entry), downloaded only then, like the server does — never from the full
 * `index.json`, tens of megabytes.
 *
 * These are therefore the only requests of the demo that leave the browser.
 * They are public, CORS-open, CDN-cached files, they are only made when the
 * integrations pages are opened, and a failure of the catalog is not an
 * error: the last index downloaded is kept (empty if none ever was, and the
 * page then shows the native integrations alone), exactly like an instance
 * whose store is unreachable.
 */

const STORE_INDEX_LITE_URL = 'https://integration-store-storage.gladysassistant.com/index-lite.json';
// per-integration file, next to the index, for a lite entry without entry_url
const STORE_ENTRY_PATH = 'integrations/';
// Index format this file knows how to read, like the server's
// SUPPORTED_INDEX_FORMAT: a future breaking format must not be displayed wrong
const SUPPORTED_INDEX_FORMAT = 1;
const STORE_TIMEOUT_MS = 10 * 1000;

const KNOWN_CATEGORIES = INTEGRATION_CATALOG_CATEGORIES;

const fetchWithTimeout = async (url, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STORE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

// One download per page load, shared by the catalog, the refresh button and
// the install pages — and never retried in a loop if the store is down
let indexPromise = null;
let fetchedAt = null;
// The last index actually downloaded, kept like the server keeps its cache:
// empty only until a first download succeeds
let lastDownloadedEntries = [];

const fetchIndexEntries = async url => {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Store index responded ${response.status}`);
  }
  const index = await response.json();
  if (index.index_format !== SUPPORTED_INDEX_FORMAT) {
    throw new Error(`Unsupported store index format ${index.index_format}`);
  }
  return Array.isArray(index.integrations) ? index.integrations : [];
};

const downloadIndex = async () => {
  try {
    const entries = await fetchIndexEntries(STORE_INDEX_LITE_URL);
    fetchedAt = new Date().toISOString();
    lastDownloadedEntries = entries;
    return lastDownloadedEntries;
  } catch (e) {
    // An unreachable store is a supported state of a real instance, not a
    // missing fixture: say so and serve the last index downloaded, exactly
    // like the server falls back on its cache. A refresh that times out must
    // not empty a catalog that had just loaded; before the first successful
    // download there is nothing to keep, and the catalog is empty.
    console.error('Demo: community integration store unreachable, serving the last catalog downloaded', e);
    return lastDownloadedEntries;
  }
};

const getIndex = ({ refresh = false } = {}) => {
  if (!indexPromise || refresh) {
    indexPromise = downloadIndex();
  }
  return indexPromise;
};

/**
 * Compatibility of an integration with the Gladys version of the demo. Every
 * manifest of the store expresses it as a simple ">=x.y.z" range; anything
 * else is given the benefit of the doubt rather than shown as incompatible
 * (the server resolves the full semver grammar, which is not worth shipping
 * in the demo bundle for a badge).
 */
const isCompatible = range => {
  const match = /^>=\s*v?(\d+)\.(\d+)\.(\d+)/.exec(String(range || '').trim());
  if (!match) {
    return true;
  }
  const required = match.slice(1, 4).map(Number);
  const current = GLADYS_VERSION.split('.').map(part => parseInt(part, 10) || 0);
  for (let i = 0; i < 3; i += 1) {
    if ((current[i] || 0) !== required[i]) {
      return (current[i] || 0) > required[i];
    }
  }
  return true;
};

/**
 * A catalog entry as the server builds it (store.buildCatalogEntry.js): the
 * index entry plus the flags the front reads. `installedBySlug` is what the
 * demo house has installed, so a community integration of the demo is marked
 * as such in the catalog instead of being offered for installation.
 */
const toCatalogEntry = (entry, installedBySlug) => {
  const installed = installedBySlug[entry.store_slug];
  return {
    store_slug: entry.store_slug,
    repo_url: entry.repo_url,
    manifest: entry.manifest,
    cover_url: entry.cover_url,
    github: entry.github,
    docs: entry.docs || null,
    // keys from a newer vocabulary than this front knows are dropped, never
    // a reason to hide the integration
    categories: Array.isArray(entry.categories)
      ? entry.categories.filter(category => KNOWN_CATEGORIES.includes(category))
      : [],
    countries: Array.isArray(entry.countries) ? entry.countries.filter(code => /^[A-Z]{2}$/.test(code)) : [],
    first_seen_at: typeof entry.first_seen_at === 'string' ? entry.first_seen_at : null,
    installed: installed !== undefined,
    installed_selector: installed ? installed.selector : null,
    update_available: false,
    compatible: isCompatible(entry.manifest && entry.manifest.gladys_version)
  };
};

/**
 * The catalog as the server builds it (store.getCatalog.js), from the lite
 * index.
 */
const getStoreCatalog = async ({ search, refresh } = {}, installedBySlug = {}) => {
  const entries = await getIndex({ refresh });
  let integrations = entries.map(entry => toCatalogEntry(entry, installedBySlug));
  if (search) {
    const keyword = search.toLowerCase();
    integrations = integrations.filter(entry => {
      const name = (entry.manifest.name || '').toLowerCase();
      const descriptions = Object.values(entry.manifest.description || {})
        .join(' ')
        .toLowerCase();
      const keywords = (entry.manifest.keywords || []).join(' ').toLowerCase();
      return (
        name.includes(keyword) ||
        descriptions.includes(keyword) ||
        keywords.includes(keyword) ||
        entry.store_slug.includes(keyword)
      );
    });
  }
  return { refreshed_at: fetchedAt, integrations };
};

/**
 * Refresh on demand, like the server's store.refreshCatalog.js: an
 * unreachable store never fails the catalog, so the catalog alone cannot tell
 * a real download from a served-from-memory one. The fetch timestamp only
 * moves on a successful download, so comparing it around the call is the
 * signal — and the front warns on `refreshed: false` instead of claiming a
 * catalog it never downloaded is up to date.
 */
const refreshStoreCatalog = async (installedBySlug = {}) => {
  const fetchedAtBefore = fetchedAt;
  const catalog = await getStoreCatalog({ refresh: true }, installedBySlug);
  return { ...catalog, refreshed: fetchedAt !== fetchedAtBefore };
};

// The last complete entry downloaded, like the server's getStoreEntry: the
// install page and the install button that follows share one download
let lastFullEntry = null;

// an error the pages read like an HTTP error of the server
const httpError = (message, status) => {
  const error = new Error(message);
  error.response = { status };
  return error;
};

// Like the server's getStoreEntryUrl: the entry_url of the lite entry when it
// is on the origin of the lite index (the index is external data, it must not
// send the browser to an arbitrary host), else the store layout
const getStoreEntryUrl = (storeSlug, entryUrl) => {
  if (typeof entryUrl === 'string') {
    try {
      if (new URL(entryUrl).origin === new URL(STORE_INDEX_LITE_URL).origin) {
        return entryUrl;
      }
    } catch (e) {
      // malformed entry_url: the derived URL below
    }
  }
  return new URL(`${STORE_ENTRY_PATH}${storeSlug.replace('/', '--')}.json`, STORE_INDEX_LITE_URL).href;
};

/**
 * The complete entry of one store integration, like the server's
 * store.getStoreEntry.js: its per-integration file, at the `entry_url` of the
 * lite entry (derived from the store layout when the lite index does not
 * know the integration yet). A 404 means "not in the store".
 */
const fetchStoreEntry = async storeSlug => {
  const entries = await getIndex();
  const liteEntry = entries.find(candidate => candidate.store_slug === storeSlug);
  const url = getStoreEntryUrl(storeSlug, liteEntry ? liteEntry.entry_url : null);
  const response = await fetchWithTimeout(url);
  if (response.status === 404) {
    throw httpError(`${storeSlug} is not in the store`, 404);
  }
  if (!response.ok) {
    throw new Error(`Store entry responded ${response.status}`);
  }
  const entry = await response.json();
  if (!entry || entry.store_slug !== storeSlug || !entry.manifest || typeof entry.manifest !== 'object') {
    throw new Error(`Invalid store entry for ${storeSlug}`);
  }
  return entry;
};

/**
 * One store integration with its complete manifest, like the server's
 * store.getStoreIntegration.js: its per-integration file is downloaded for
 * it. It answers like the server: 400 without store_slug, 404 when absent
 * from the store.
 */
const getStoreIntegration = async ({ store_slug: storeSlug } = {}, installedBySlug = {}) => {
  if (!storeSlug) {
    throw httpError('store_slug is required', 400);
  }
  if (!lastFullEntry || lastFullEntry.store_slug !== storeSlug) {
    lastFullEntry = await fetchStoreEntry(storeSlug);
  }
  return toCatalogEntry(lastFullEntry, installedBySlug);
};

/**
 * Documentation of a store integration. The server re-hosts the markdown of
 * the index entry; the demo downloads it from the same URL, so the modal shows
 * the real documentation of the real integration.
 */
const getStoreDocs = async ({ store_slug: storeSlug, lang }) => {
  const entries = await getIndex();
  const entry = entries.find(candidate => candidate.store_slug === storeSlug);
  const urls = (entry && entry.docs) || {};
  const url = urls[lang] || urls.en || urls.fr;
  if (!url) {
    throw new Error(`No documentation for ${storeSlug}`);
  }
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Documentation responded ${response.status}`);
  }
  return { content: await response.text(), url };
};

export { getStoreCatalog, getStoreIntegration, refreshStoreCatalog, getStoreDocs, STORE_INDEX_LITE_URL };
