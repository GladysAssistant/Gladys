const axios = require('axios');

const { NotFoundError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { MANIFEST_FILE_NAME } = require('../constants');
const { STORE_HTTP_TIMEOUT_MS } = require('./store.constants');

/**
 * @description Fetch and validate the manifest of a GitHub repo (indexed or
 * not): resolve the default branch through the GitHub API, then download
 * `gladys-assistant-integration.json` from the raw endpoint and validate it
 * with the same rules as the indexer. The update passes `validate: false`: it
 * checks the `gladys_version` of the manifest *before* validating it (a
 * manifest written for a newer Gladys usually declares fields this one does
 * not know yet, and "requires Gladys >=x" is what the admin must be told,
 * not "unknown field"), then validates it itself.
 * @param {string} storeSlug - The `owner/repo` slug.
 * @param {object} [options] - Options.
 * @param {boolean} [options.validate] - Validate the manifest (default true).
 * @returns {Promise<object>} Resolve with the manifest (validated unless `validate` is false).
 * @example
 * const manifest = await gladys.externalIntegration.fetchManifestFromRepo('john/gladys-open-meteo-demo');
 */
async function fetchManifestFromRepo(storeSlug, { validate = true } = {}) {
  const [owner, repo] = storeSlug.split('/');
  let defaultBranch;
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      timeout: STORE_HTTP_TIMEOUT_MS,
    });
    defaultBranch = data.default_branch || 'main';
  } catch (e) {
    if (e.response && e.response.status === 404) {
      throw new NotFoundError('REPOSITORY_NOT_FOUND');
    }
    throw e;
  }
  let manifest;
  try {
    const { data } = await axios.get(
      `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${MANIFEST_FILE_NAME}`,
      {
        timeout: STORE_HTTP_TIMEOUT_MS,
        // keep the raw string so we control the JSON parsing error
        transformResponse: [(rawData) => rawData],
      },
    );
    manifest = JSON.parse(data);
  } catch (e) {
    if (e.response && e.response.status === 404) {
      throw new Error422(`MANIFEST_NOT_FOUND: no ${MANIFEST_FILE_NAME} at the root of the repository`);
    }
    if (e instanceof SyntaxError) {
      throw new Error422(`INVALID_MANIFEST: ${MANIFEST_FILE_NAME} is not valid JSON`);
    }
    throw e;
  }
  return validate ? this.validateManifest(manifest) : manifest;
}

module.exports = {
  fetchManifestFromRepo,
};
