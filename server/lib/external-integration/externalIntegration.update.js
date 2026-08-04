const Promise = require('bluebird');
const semver = require('semver');

const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, PlatformNotCompatible } = require('../../utils/coreErrors');
const { Error422 } = require('../../utils/httpErrors');
const { MANIFEST_IMAGE_LABEL } = require('./constants');

/**
 * @description Pick the manifest carrying the most recent version between the
 * store index entry and the manifest read directly from the repo. The repo
 * wins ties: it is the source the indexer mirrors, so an equal version means
 * the same release, and it is always at least as fresh as the index.
 * @param {object|null} indexManifest - The manifest of the store index entry.
 * @param {object|null} repoManifest - The manifest read from the repo.
 * @returns {object|null} The most recent manifest, null if there is none.
 * @example
 * const manifest = getMostRecentManifest(indexManifest, repoManifest);
 */
function getMostRecentManifest(indexManifest, repoManifest) {
  if (!indexManifest) {
    return repoManifest;
  }
  if (!repoManifest) {
    return indexManifest;
  }
  const indexVersion = semver.valid(indexManifest.version);
  const repoVersion = semver.valid(repoManifest.version);
  if (repoVersion === null) {
    return indexManifest;
  }
  if (indexVersion === null) {
    return repoManifest;
  }
  return semver.gt(indexVersion, repoVersion) ? indexManifest : repoManifest;
}

/**
 * @description Update an external integration: resolve the latest manifest
 * (from the store index by store_slug, or directly from the repo), pull the
 * new image and recreate the container (which rotates the integration token:
 * the previous JWT is instantly invalidated). For dev installs without a
 * store_slug, the image tag installed by the user is re-pulled and the
 * manifest is refreshed from the labels of the new image. Updates are an
 * explicit admin gesture — no auto-update in v1.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the updated integration.
 * @example
 * await gladys.externalIntegration.update('ext-john-gladys-open-meteo-demo');
 */
async function update(selector) {
  let service = await this.getBySelector(selector);
  if (!this.available) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  let { manifest } = service;
  let image = service.docker_image;
  if (service.store_slug) {
    // an update is an explicit admin gesture: no cache may decide its
    // outcome. The store index lags behind the repo by up to 1h30 (the
    // indexer rebuilds it hourly, the client caches it 30 min), so reading
    // the in-memory index would resolve a release published minutes ago to
    // the *previous* manifest — the same image tag re-pulled, nothing
    // updated, a "Force update" button that looks broken. Both sources are
    // read (index refreshed on the spot + repo manifest, the source of truth
    // the indexer itself mirrors) and the most recent version wins.
    let indexManifest = null;
    try {
      const index = await this.getIndex({ refresh: true });
      const entry = ((index && index.integrations) || []).find(
        (indexEntry) => indexEntry.store_slug === service.store_slug,
      );
      indexManifest = (entry && entry.manifest) || null;
    } catch (e) {
      logger.warn(`Unable to refresh the store index before updating ${service.store_slug}`, e);
    }
    let repoManifest = null;
    try {
      repoManifest = await this.fetchManifestFromRepo(service.store_slug);
      // the cache read by isUpdateAvailable follows, so the "update
      // available" banner reflects the version we just resolved
      this.repoManifests.set(service.store_slug, repoManifest);
    } catch (e) {
      logger.warn(`Unable to fetch the latest manifest of ${service.store_slug} from its repository`, e);
    }
    const latestManifest = getMostRecentManifest(indexManifest, repoManifest);
    if (latestManifest === null) {
      logger.warn(`No manifest found for ${service.store_slug}, re-pulling the current image`);
    } else {
      manifest = latestManifest;
    }
    this.validateManifest(manifest);
    image = (manifest && manifest.docker_image) || service.docker_image;
  }
  try {
    await this.system.pull(image);
  } catch (e) {
    logger.warn(`Unable to pull image ${image}`, e);
    throw new BadParameters(`UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`);
  }
  if (!service.store_slug) {
    // dev install by image: the user installed a specific tag (:dev...) that
    // may differ from the released image declared in manifest.docker_image —
    // the pull above targeted service.docker_image on purpose. A new build
    // of that tag ships its manifest in the image labels: refresh it so
    // config schema / containers / actions changes are picked up.
    try {
      const labels = await this.system.getImageLabels(image);
      const rawManifest = labels[MANIFEST_IMAGE_LABEL];
      if (rawManifest) {
        try {
          manifest = JSON.parse(rawManifest);
        } catch (e) {
          throw new Error422(`INVALID_MANIFEST: ${MANIFEST_IMAGE_LABEL} label is not valid JSON`);
        }
        this.validateManifest(manifest);
      }
    } catch (e) {
      if (e instanceof Error422) {
        // a broken manifest in the freshly pulled image must surface to the
        // developer, before anything is stopped or recreated
        throw e;
      }
      logger.warn(`Unable to read the image labels of ${image}, keeping the stored manifest`, e);
    }
  }
  await Promise.each((manifest && manifest.containers) || [], async (entry) => {
    try {
      await this.system.pull(entry.docker_image);
    } catch (e) {
      logger.warn(`Unable to pull image ${entry.docker_image}`, e);
      throw new BadParameters(
        `UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`,
      );
    }
  });
  if (service.container_id) {
    try {
      await this.system.stopContainer(service.container_id);
    } catch (e) {
      logger.debug(e);
    }
  }
  // update = recreation of the whole group according to the new manifest:
  // the sub-containers of the OLD manifest are removed (the private network
  // and the /data volumes stay), the new ones are recreated at start
  try {
    await this.removeSubContainers(service, { removeNetwork: false });
  } catch (e) {
    logger.warn(`Unable to remove sub-containers of integration ${selector} before update`, e);
  }
  await db.Service.update({ version: manifest.version, manifest, docker_image: image }, { where: { id: service.id } });
  service = await this.getBySelector(selector);
  await this.createIntegrationContainer(service);
  return this.start(selector);
}

module.exports = {
  update,
};
