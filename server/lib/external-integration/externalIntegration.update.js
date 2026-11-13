const Promise = require('bluebird');
const semver = require('semver');

const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, PlatformNotCompatible } = require('../../utils/coreErrors');
const { Error422 } = require('../../utils/httpErrors');
const { MANIFEST_IMAGE_LABEL, UPDATE_SKIP_REASONS } = require('./constants');
const { coerceGladysVersion, getUnsatisfiedGladysVersion } = require('./store/store.buildCatalogEntry');

const MANIFEST_SOURCE_REPO = 'repo';
const MANIFEST_SOURCE_INDEX = 'index';
const MANIFEST_SOURCE_INSTALLED = 'installed';

/**
 * @description Build the ordered list of manifests to try for an update: the
 * ones known by the store index and by the repo, most recent first (the repo
 * winning ties, it is the source the indexer mirrors), then the manifest
 * already installed as a last resort — re-pulling the running image is what
 * "force update" did before, and it must stay possible when both remote
 * sources are unusable. A manifest whose `gladys_version` the running Gladys
 * does not satisfy is dropped first — checked before validateManifest, since
 * a manifest written for a newer Gladys usually also declares fields this one
 * does not know, and the version requirement is the reason the admin must be
 * given. Manifests refused by validateManifest are dropped rather than
 * raised: the index is unmoderated external data, one bad entry must not
 * make the button fail. Every dropped manifest is recorded in `skipped`, so
 * the update can say which version it did not apply, and why. Deduplicated
 * by image, so a source advertising the image already installed is not
 * pulled twice.
 * @param {object} supervisor - The external integration service.
 * @param {object} service - The installed integration (plain object).
 * @param {object|null} indexManifest - The manifest of the store index entry.
 * @param {object|null} repoManifest - The manifest read from the repo (not validated yet).
 * @returns {object} { candidates, skipped }: the candidates, each { manifest, image, source },
 * and the dropped manifests, each { version, source, reason, gladys_version }.
 * @example
 * const { candidates, skipped } = buildUpdateCandidates(this, service, indexManifest, repoManifest);
 */
function buildUpdateCandidates(supervisor, service, indexManifest, repoManifest) {
  const gladysVersion = coerceGladysVersion(supervisor.system.gladysVersion);
  const skipped = [];
  const remoteCandidates = [
    { manifest: repoManifest, source: MANIFEST_SOURCE_REPO },
    { manifest: indexManifest, source: MANIFEST_SOURCE_INDEX },
  ]
    .filter(({ manifest, source }) => {
      if (!manifest) {
        return false;
      }
      const requiredGladysVersion = getUnsatisfiedGladysVersion(manifest, gladysVersion);
      if (requiredGladysVersion !== null) {
        logger.info(
          `Ignoring the ${source} manifest of ${service.store_slug}: version ${manifest.version} requires Gladys ${requiredGladysVersion}`,
        );
        skipped.push({
          version: manifest.version,
          source,
          reason: UPDATE_SKIP_REASONS.GLADYS_VERSION,
          gladys_version: requiredGladysVersion,
        });
        return false;
      }
      try {
        supervisor.validateManifest(manifest);
        return true;
      } catch (e) {
        logger.warn(`Ignoring the invalid ${source} manifest of ${service.store_slug}`, e);
        skipped.push({
          version: manifest.version,
          source,
          reason: UPDATE_SKIP_REASONS.INVALID_MANIFEST,
          gladys_version: null,
        });
        return false;
      }
    })
    // Array.prototype.sort is stable: equal versions keep the repo first
    .sort((first, second) => semver.compare(second.manifest.version, first.manifest.version))
    // validateManifest guarantees a usable docker_image reference
    .map((candidate) => ({ ...candidate, image: candidate.manifest.docker_image }));
  const seenImages = new Set();
  const candidates = remoteCandidates
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
  return { candidates, skipped };
}

/**
 * @description Pull the image of the first candidate that can actually be
 * pulled. A version bumped on the default branch before its image is
 * published (the release workflow is still building) must not turn the
 * update into a dead end: the next candidate — the indexed release, then the
 * running image — takes over. For dev installs only (`allowLocal`), a failed
 * pull additionally falls back on the image already present locally
 * (ensureImage: the dev workflow rebuilds an image with `docker build` that
 * exists in no registry). Store updates keep the strict pull rule: a remote
 * failure fails closed instead of silently recreating from a local tag.
 * @param {object} supervisor - The external integration service.
 * @param {Array} candidates - The candidates built by buildUpdateCandidates.
 * @param {object} options - Options.
 * @param {boolean} options.allowLocal - Local fallback (dev installs only).
 * @returns {Promise<object>} { applied, unavailable }: the applied candidate (null
 * if none is available) and the candidates whose image could not be pulled.
 * @example
 * const { applied, unavailable } = await pullFirstAvailable(this, candidates, { allowLocal: false });
 */
async function pullFirstAvailable(supervisor, candidates, { allowLocal }) {
  const unavailable = [];
  const applied = await Promise.reduce(
    candidates,
    async (appliedCandidate, candidate) => {
      if (appliedCandidate !== null) {
        return appliedCandidate;
      }
      try {
        await supervisor.ensureImage(candidate.image, { allowLocal });
        return candidate;
      } catch (e) {
        logger.warn(`Unable to get image ${candidate.image}`, e);
        unavailable.push(candidate);
        return null;
      }
    },
    null,
  );
  return { applied, unavailable };
}

/**
 * @description The version the update did not apply although it is newer
 * than the one it installed: the most recent of the skipped manifests (a
 * `gladys_version` the running Gladys does not satisfy, an invalid manifest,
 * an image that could not be pulled). Without it, an update falling back on
 * the running image is a silent success: the version does not change and
 * nothing says why.
 * @param {Array} skipped - The skipped manifests, each { version, source, reason, gladys_version }.
 * @param {string} appliedVersion - The version the update installed.
 * @returns {object|null} { version, reason, gladys_version }, null when the
 * latest known version was installed.
 * @example
 * const skippedUpdate = getSkippedUpdate(skipped, '3.5.0');
 */
function getSkippedUpdate(skipped, appliedVersion) {
  const newerSkipped = skipped
    .filter((entry) => semver.valid(entry.version) !== null && semver.gt(entry.version, appliedVersion))
    // Array.prototype.sort is stable: equal versions keep the first recorded
    .sort((first, second) => semver.compare(second.version, first.version));
  if (newerSkipped.length === 0) {
    return null;
  }
  const { version, reason, gladys_version: gladysVersion } = newerSkipped[0];
  return { version, reason, gladys_version: gladysVersion };
}

/**
 * @description Update an external integration: resolve the latest manifest
 * (store index refreshed on the spot *and* manifest of the repo, most recent
 * first, falling back on the running image), pull the first image that can
 * actually be pulled and recreate the container (which rotates the
 * integration token: the previous JWT is instantly invalidated). For dev
 * installs without a store_slug, the image tag installed by the user is
 * re-pulled — or, for an image only built locally, re-read from the local
 * store — and the manifest is refreshed from the labels of the new image.
 * Once the new containers have started, the images the previous version left
 * behind are removed — an integration updated a dozen times used to cost a
 * dozen images. The result carries `skipped_update`: the most recent version
 * newer than the one installed that could not be applied, and why (see
 * getSkippedUpdate), null when the latest known version was installed.
 * Updates are an explicit admin gesture — no auto-update in v1.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the updated integration and its `skipped_update`.
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
    // read (store entry downloaded on the spot + repo manifest, the
    // source of truth the indexer itself mirrors) and the most recent
    // pullable one wins.
    try {
      const entry = await this.getStoreEntry(service.store_slug, { refresh: true });
      indexManifest = (entry && entry.manifest) || null;
    } catch (e) {
      logger.warn(`Unable to refresh the store index before updating ${service.store_slug}`, e);
    }
    try {
      // not validated there: buildUpdateCandidates checks its gladys_version
      // first, then validates it
      repoManifest = await this.fetchManifestFromRepo(service.store_slug, { validate: false });
    } catch (e) {
      logger.warn(`Unable to fetch the latest manifest of ${service.store_slug} from its repository`, e);
    }
  }
  const { candidates, skipped } = buildUpdateCandidates(this, service, indexManifest, repoManifest);
  const allowLocal = !service.store_slug;
  const { applied, unavailable } = await pullFirstAvailable(this, candidates, { allowLocal });
  if (applied === null) {
    throw new BadParameters(`UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`);
  }
  unavailable.forEach((candidate) => {
    skipped.push({
      version: candidate.manifest.version,
      source: candidate.source,
      reason: UPDATE_SKIP_REASONS.IMAGE_UNAVAILABLE,
      gladys_version: null,
    });
  });
  let { manifest } = applied;
  const { image } = applied;
  if (service.store_slug) {
    if (applied.source === MANIFEST_SOURCE_REPO) {
      // the cache read by isUpdateAvailable follows, so the "update
      // available" banner reflects the version we just resolved
      this.repoManifests.set(service.store_slug, manifest);
    } else if (
      skipped.some(
        (entry) => entry.source === MANIFEST_SOURCE_REPO && entry.reason === UPDATE_SKIP_REASONS.GLADYS_VERSION,
      )
    ) {
      // a repo version requiring another Gladys never turns the badge on
      // (isUpdateAvailable), it feeds the "update Gladys first" notice
      // (getRequiredGladysVersion): kept, that notice says what this update
      // just said, even while the index has not caught up with the repo
      this.repoManifests.set(service.store_slug, repoManifest);
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
  // computed before anything is stopped: should it throw, the running
  // version is left untouched
  const skippedUpdate = getSkippedUpdate(skipped, manifest.version);
  await Promise.each((manifest && manifest.containers) || [], async (entry) => {
    await this.ensureImage(entry.docker_image, { allowLocal });
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
  // the new manifest may declare other widgets, other settings: no content
  // produced under the previous version survives the update
  this.clearWidgetCaches(service);
  service = await this.getBySelector(selector);
  // the proxy closes over the service object it was registered with: the
  // updated row (manifest, version, image) replaces the boot-time snapshot
  this.registerProxyService(service);
  await this.declareEnergyCalendars(service);
  await this.createIntegrationContainer(service);
  const started = await this.start(selector);
  // only once start() has gone through: it resolves on LOADING, not RUNNING, so
  // this buys the container being created and started, not a healthy
  // integration. A release that starts and never authenticates still gets its
  // predecessor collected — rolling back then means re-pulling the old tag.
  // Keeping the cleanup after start() is still what we want: a start that
  // throws (no image, no network, Docker down) skips it entirely.
  await this.removeImages(previousImages);
  return { ...started, skipped_update: skippedUpdate };
}

module.exports = {
  update,
};
