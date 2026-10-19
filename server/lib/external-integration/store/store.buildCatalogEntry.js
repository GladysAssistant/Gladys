const semver = require('semver');

const { INTEGRATION_CATALOG_CATEGORIES } = require('../../../utils/constants');

const KNOWN_CATEGORIES = new Set(INTEGRATION_CATALOG_CATEGORIES);

/**
 * @description Build a store catalog entry for the frontend from an index
 * entry: the `installed` / `update_available` flags, and the `compatible`
 * flag computed from the current Gladys version against the gladys_version
 * range of the manifest.
 * @param {object} entry - The index entry (lite or full).
 * @param {object} [installedService] - The installed service with this store_slug.
 * @param {string|null} gladysVersion - The current Gladys version (coerced semver), or null.
 * @returns {object} The catalog entry.
 * @example
 * const catalogEntry = buildCatalogEntry(entry, installedService, '4.60.0');
 */
function buildCatalogEntry(entry, installedService, gladysVersion) {
  // the index is external data: a malformed range must not abort the catalog
  const gladysVersionRange = semver.validRange(entry.manifest.gladys_version);
  let compatible = false;
  if (gladysVersionRange !== null) {
    compatible = gladysVersion === null ? true : semver.satisfies(gladysVersion, gladysVersionRange);
  }
  return {
    store_slug: entry.store_slug,
    repo_url: entry.repo_url,
    manifest: entry.manifest,
    cover_url: entry.cover_url,
    github: entry.github,
    docs: entry.docs || null,
    // browse categories computed by the indexer (manifest field or fallback
    // mapping): keys from a newer vocabulary than this instance knows are
    // dropped, never a reason to hide the integration
    categories: Array.isArray(entry.categories)
      ? entry.categories.filter((category) => KNOWN_CATEGORIES.has(category))
      : [],
    // first indexing date of the store_slug, persisted by the indexer
    // across rebuilds: powers the "Newest first" sort of the catalog
    first_seen_at: typeof entry.first_seen_at === 'string' ? entry.first_seen_at : null,
    installed: installedService !== undefined,
    installed_selector: installedService ? installedService.selector : null,
    update_available: installedService ? installedService.update_available : false,
    compatible,
  };
}

/**
 * @description The current Gladys version coerced to semver, or null when unknown.
 * @param {string} [gladysVersion] - The raw Gladys version.
 * @returns {string|null} The coerced version.
 * @example
 * const version = coerceGladysVersion('v4.60.0');
 */
function coerceGladysVersion(gladysVersion) {
  const coercedVersion = gladysVersion ? semver.coerce(gladysVersion) : null;
  return coercedVersion ? coercedVersion.version : null;
}

module.exports = {
  buildCatalogEntry,
  coerceGladysVersion,
};
