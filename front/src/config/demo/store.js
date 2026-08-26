import { INTEGRATION_CATALOG_CATEGORIES } from '../../../../server/utils/constants';
import { version as GLADYS_VERSION } from '../../../../package.json';

/**
 * The community integration store of the demo.
 *
 * This is the one thing the demo does not invent. The catalog of external
 * integrations is a public static index (`index.json`) rebuilt hourly by the
 * indexer (GladysAssistant/integration-store) and downloaded by every Gladys
 * instance — see `server/lib/external-integration/store/store.constants.js`,
 * which this file mirrors. The demo downloads the very same file, straight
 * from the browser, so the demo catalog *is* the live catalog: a snapshot
 * committed here would be a week out of date and would show integrations that
 * no longer exist (or, worse, hide the ones published since).
 *
 * It is therefore the only request of the demo that leaves the browser. It is
 * a public, CORS-open, CDN-cached file, it is only made when the integrations
 * page is opened, and a failure is not an error: the catalog is then empty and
 * the page shows the native integrations alone, exactly like an instance whose
 * store is unreachable.
 */

const STORE_INDEX_URL = 'https://integration-store-storage.gladysassistant.com/index.json';
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

const downloadIndex = async () => {
  try {
    const response = await fetchWithTimeout(STORE_INDEX_URL);
    if (!response.ok) {
      throw new Error(`Store index responded ${response.status}`);
    }
    const index = await response.json();
    if (index.index_format !== SUPPORTED_INDEX_FORMAT) {
      throw new Error(`Unsupported store index format ${index.index_format}`);
    }
    fetchedAt = new Date().toISOString();
    return Array.isArray(index.integrations) ? index.integrations : [];
  } catch (e) {
    // An unreachable store is a supported state of a real instance, not a
    // missing fixture: say so and show an empty catalog.
    console.error('Demo: community integration store unreachable, catalog left empty', e);
    fetchedAt = null;
    return [];
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
 * The catalog as the server builds it (store.getCatalog.js): index entries
 * plus the flags the front reads. `installedSlugs` is what the demo house has
 * installed, so a community integration of the demo is marked as such in the
 * catalog instead of being offered for installation.
 */
const getStoreCatalog = async ({ search, refresh } = {}, installedBySlug = {}) => {
  const entries = await getIndex({ refresh });
  let integrations = entries.map(entry => {
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
      first_seen_at: typeof entry.first_seen_at === 'string' ? entry.first_seen_at : null,
      installed: installed !== undefined,
      installed_selector: installed ? installed.selector : null,
      update_available: false,
      compatible: isCompatible(entry.manifest && entry.manifest.gladys_version)
    };
  });
  if (search) {
    const keyword = search.toLowerCase();
    integrations = integrations.filter(entry => {
      const name = (entry.manifest.name || '').toLowerCase();
      const descriptions = Object.values(entry.manifest.description || {})
        .join(' ')
        .toLowerCase();
      return name.includes(keyword) || descriptions.includes(keyword) || entry.store_slug.includes(keyword);
    });
  }
  return { refreshed_at: fetchedAt, integrations };
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

export { getStoreCatalog, getStoreDocs, STORE_INDEX_URL };
