const Promise = require('bluebird');
const semver = require('semver');

const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, PlatformNotCompatible } = require('../../utils/coreErrors');
const { Error422 } = require('../../utils/httpErrors');
const { MANIFEST_IMAGE_LABEL } = require('./constants');

const MANIFEST_SOURCE_REPO = 'repo';
const MANIFEST_SOURCE_INDEX = 'index';
const MANIFEST_SOURCE_INSTALLED = 'installed';

/**
 * @description Build the ordered list of manifests to try for an update: the
 * ones known by the store index and by the repo, most recent first (the repo
 * winning ties, it is the source the indexer mirrors), then the manifest
 * already installed as a last resort — re-pulling the running image is what
 * "force update" did before, and it must stay possible when both remote
 * sources are unusable. Manifests refused by validateManifest are dropped
 * rather than raised: the index is unmoderated external data, one bad entry
 * must not make the button fail. Deduplicated by image, so a source
 * advertising the image already installed is not pulled twice.
 * @param {object} supervisor - The external integration service.
 * @param {object} service - The installed integration (plain object).
 * @param {object|null} indexManifest - The manifest of the store index entry.
 * @param {object|null} repoManifest - The manifest read from the repo.
 * @returns {Array} The candidates, each { manifest, image, source }.
 * @example
 * const candidates = buildUpdateCandidates(this, service, indexManifest, repoManifest);
 */
function buildUpdateCandidates(supervisor, service, indexManifest, repoManifest) {
  const remoteCandidates = [
    { manifest: repoManifest, source: MANIFEST_SOURCE_REPO },
    { manifest: indexManifest, source: MANIFEST_SOURCE_INDEX },
  ]
    .filter(({ manifest, source }) => {
      if (!manifest) {
        return false;
      }
      try {
        supervisor.validateManifest(manifest);
        return true;
      } catch (e) {
        logger.warn(`Ignoring the invalid ${source} manifest of ${service.store_slug}`, e);
        return false;
      }
    })
    // Array.prototype.sort is stable: equal versions keep the repo first
    .sort((first, second) => semver.compare(second.manifest.version, first.manifest.version))
    // validateManifest guarantees a usable docker_image reference
    .map((candidate) => ({ ...candidate, image: candidate.manifest.docker_image }));
  const seenImages = new Set();
  return remoteCandidates
    .concat([
      // the installed tag, never the released image of the stored manifest:
      // a dev install runs a :dev tag the manifest does not declare
      { manifest: service.manifest, source: MANIFEST_SOURCE_INSTALLED, image: service.docker_image },
    ])
    .filter((candidate) => {
      if (seenImages.has(candidate.image)) {
        return false;
      }
      seenImages.add(candidate.image);
      return true;
    });
}

/**
 * @description Pull the image of the first candidate that can actually be
 * pulled. A version bumped on the default branch before its image is
 * published (the release workflow is still building) must not turn the
 * update into a dead end: the next candidate — the indexed release, then the
 * running image — takes over.
 * @param {object} supervisor - The external integration service.
 * @param {Array} candidates - The candidates built by buildUpdateCandidates.
 * @returns {Promise<object|null>} The applied candidate, null if none could be pulled.
 * @example
 * const applied = await pullFirstAvailable(this, candidates);
 */
async function pullFirstAvailable(supervisor, candidates) {
  return Promise.reduce(
    candidates,
    async (applied, candidate) => {
      if (applied !== null) {
        return applied;
      }
      try {
        await supervisor.system.pull(candidate.image);
        return candidate;
      } catch (e) {
        logger.warn(`Unable to pull image ${candidate.image}`, e);
        return null;
      }
    },
    null,
  );
}

/**
 * @description Update an external integration: resolve the latest manifest
 * (store index refreshed on the spot *and* manifest of the repo, most recent
 * first, falling back on the running image), pull the first image that can
 * actually be pulled and recreate the container (which rotates the
 * integration token: the previous JWT is instantly invalidated). For dev
 * installs without a store_slug, the image tag installed by the user is
 * re-pulled and the manifest is refreshed from the labels of the new image.
 * Once the new containers have started, the images the previous version left
 * behind are removed — an integration updated a dozen times used to cost a
 * dozen images.
 * Updates are an explicit admin gesture — no auto-update in v1.
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
  let indexManifest = null;
  let repoManifest = null;
  if (service.store_slug) {
    // an update is an explicit admin gesture: no cache may decide its
    // outcome. The store index lags behind the repo by up to 1h30 (the
    // indexer rebuilds it hourly, the client caches it 30 min), so reading
    // the in-memory index would resolve a release published minutes ago to
    // the *previous* manifest — the same image tag re-pulled, nothing
    // updated, a "Force update" button that looks broken. Both sources are
    // read (index refreshed on the spot + repo manifest, the source of truth
    // the indexer itself mirrors) and the most recent pullable one wins.
    try {
      const index = await this.getIndex({ refresh: true });
      const entry = ((index && index.integrations) || []).find(
        (indexEntry) => indexEntry.store_slug === service.store_slug,
      );
      indexManifest = (entry && entry.manifest) || null;
    } catch (e) {
      logger.warn(`Unable to refresh the store index before updating ${service.store_slug}`, e);
    }
    try {
      repoManifest = await this.fetchManifestFromRepo(service.store_slug);
    } catch (e) {
      logger.warn(`Unable to fetch the latest manifest of ${service.store_slug} from its repository`, e);
    }
  }
  const candidates = buildUpdateCandidates(this, service, indexManifest, repoManifest);
  const applied = await pullFirstAvailable(this, candidates);
  if (applied === null) {
    throw new BadParameters(`UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`);
  }
  let { manifest } = applied;
  const { image } = applied;
  if (service.store_slug) {
    if (applied.source === MANIFEST_SOURCE_REPO) {
      // the cache read by isUpdateAvailable follows, so the "update
      // available" banner reflects the version we just resolved
      this.repoManifests.set(service.store_slug, manifest);
    } else {
      // a repo version we could not pull must never drive update detection:
      // it would keep the badge on and send every later force update back to
      // the same unpullable tag, ignoring the release that does work
      this.repoManifests.delete(service.store_slug);
    }
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
  // captured before the row is rewritten: what the integration ran *until now*.
  // Whatever the new manifest still declares is filtered back out by
  // removeImages, so a sub-container image kept across the update survives.
  const previousImages = [
    service.docker_image,
    ...this.getManifestContainers(service).map((entry) => entry.docker_image),
  ];
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
  const started = await this.start(selector);
  // only once start() has gone through: it resolves on LOADING, not RUNNING, so
  // this buys the container being created and started, not a healthy
  // integration. A release that starts and never authenticates still gets its
  // predecessor collected — rolling back then means re-pulling the old tag.
  // Keeping the cleanup after start() is still what we want: a start that
  // throws (no image, no network, Docker down) skips it entirely.
  await this.removeImages(previousImages);
  return started;
}

module.exports = {
  update,
};
