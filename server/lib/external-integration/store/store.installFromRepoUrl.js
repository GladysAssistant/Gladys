const { BadParameters } = require('../../../utils/coreErrors');

const GITHUB_REPO_URL_REGEX = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/;

/**
 * @description Install an integration from a GitHub repo URL, indexed or
 * not: fetch and validate the manifest from the repo (same JSON rules as
 * the indexer), then follow the standard install path. The store_slug is
 * deduced (`owner/repo`) so update detection works even before the repo is
 * crawled by the indexer.
 * @param {string} repoUrl - The GitHub repository URL.
 * @param {object} [options] - Install options (grantedDevices...).
 * @returns {Promise<object>} Resolve with the installed integration.
 * @example
 * await gladys.externalIntegration.installFromRepoUrl('https://github.com/john/gladys-open-meteo-demo');
 */
async function installFromRepoUrl(repoUrl, options = {}) {
  const match = typeof repoUrl === 'string' ? repoUrl.trim().match(GITHUB_REPO_URL_REGEX) : null;
  if (!match) {
    throw new BadParameters('repo_url: must be a GitHub repository URL (https://github.com/owner/repo)');
  }
  const storeSlug = `${match[1]}/${match[2]}`;
  const manifest = await this.fetchManifestFromRepo(storeSlug);
  this.repoManifests.set(storeSlug, manifest);
  return this.install({ manifest, storeSlug, ...options });
}

module.exports = {
  installFromRepoUrl,
};
