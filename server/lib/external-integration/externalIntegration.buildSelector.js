const db = require('../../models');
const { slugify } = require('../../utils/slugify');
const { SELECTOR_PREFIX, DEV_SELECTOR_PREFIX } = require('./constants');

/**
 * @description Derive the selector (and name) of an external integration.
 * Store or repo_url install: `ext-<owner>-<repo>` slugified, unique by
 * construction (it's the store_slug). Dev install by image: `ext-dev-<manifest
 * name slugified>`, with a numeric suffix in case of collision.
 * @param {object} options - Options.
 * @param {string} [options.storeSlug] - The store slug (`owner/repo`), if any.
 * @param {string} [options.manifestName] - The name of the manifest (dev install).
 * @returns {Promise<string>} Resolve with the selector.
 * @example
 * const selector = await buildSelector({ storeSlug: 'john/gladys-open-meteo-demo' });
 */
async function buildSelector({ storeSlug, manifestName }) {
  if (storeSlug) {
    return `${SELECTOR_PREFIX}${slugify(storeSlug.replace(/\//g, '-'))}`;
  }
  const base = `${DEV_SELECTOR_PREFIX}${slugify(manifestName)}`;
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while ((await db.Service.findOne({ where: { selector: candidate } })) !== null) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

module.exports = {
  buildSelector,
};
